/**
 * VortexEngine — implements spec §4 (REQUEST -> IDENTITY -> AUTHORIZATION
 * -> LIMITS -> ONBOARD -> EXECUTION -> PROOF -> VERIFICATION) as a single
 * enforced pipeline. This is the piece a "vortex-mcp-<lang>" port in any
 * other language must reproduce; server.ts is just the MCP transport
 * wrapper around it (spec §3: "MCP transporta a intenção. Vortex governa
 * a execução.").
 */
import type { VortexConnector } from "./connector.js";
import { Gos3Registry } from "./gos3.js";
import type { Ed25519Keypair } from "./identity.js";
import { assertAuthorized, evaluatePolicy } from "./policy.js";
import { buildAndSignProof } from "./proof.js";
import { ReplayStore } from "./replay-store.js";
import type { SandboxScope } from "./types.js";
import { VortexError } from "./types.js";
import type { AuthorizationContext, ExecutionProof, VortexPolicy } from "./types.js";
import { withTimeout } from "./sandbox.js";

export interface VortexRequest {
  request_id: string;
  operation: string; // e.g. "repository.write"
  kind: "inspect" | "propose" | "verify" | "execute" | "branch.write";
  ctx: AuthorizationContext;
  args: Record<string, unknown>;
}

export interface VortexResponse {
  status: string;
  output: unknown;
  execution_proof: ExecutionProof;
}

const DEFAULT_SANDBOX: SandboxScope = {
  sandbox_id: "sandbox-default",
  filesystem_scope: [],
  network_scope: [],
  process_scope: [],
  credential_scope: [],
  resource_limits: { timeout_ms: 30_000 },
};

export class VortexEngine {
  constructor(
    private readonly runtimeId: string,
    private readonly policy: VortexPolicy,
    private readonly connectors: Map<string, VortexConnector>,
    private readonly keypair: Ed25519Keypair,
    private readonly gos3: Gos3Registry = new Gos3Registry(),
    private readonly replay: ReplayStore = new ReplayStore(),
    private readonly sandboxes: Map<string, SandboxScope> = new Map([["sandbox-default", DEFAULT_SANDBOX]]),
  ) {}

  onboard(resources: string[], ttlMs?: number) {
    return this.gos3.onboard("", "", resources, ttlMs);
  }

  registerSandbox(sandbox: SandboxScope): void {
    this.sandboxes.set(sandbox.sandbox_id, sandbox);
  }

  async handle(req: VortexRequest, connectorId: string): Promise<VortexResponse> {
    const startedAt = new Date();

    // 1. Anti-replay — reserve request_id ATOMICALLY before any `await`
    // below. This must be the very first thing handle() does: reserving
    // and rejecting in the same synchronous call closes the check-then-act
    // race that existed when reservation was deferred until after
    // execution (see replay-store.ts).
    try {
      this.replay.reserve(req.request_id);
    } catch (e) {
      const err = e as VortexError;
      return this.deny(req, startedAt, err.status, err.message, connectorId);
    }

    // 2. Identity is implicit here (single keypair per runtime); a
    //    multi-agent runtime would resolve req.ctx.agent_id -> keypair here
    //    and reject with IDENTITY_INVALID on mismatch.

    // 3. Authorization / policy.
    const decision = evaluatePolicy(this.policy, req.ctx);
    if (decision.decision === "prohibited") {
      return this.deny(req, startedAt, "POLICY_DENIED", decision.reason, connectorId);
    }
    if (decision.decision === "required" && req.kind !== "propose" && req.kind !== "inspect") {
      // side-effecting ops under a "required" rule need prior human
      // approval represented as an already-onboarded GOS3 session.
      try {
        this.gos3.requireOnboarded(req.ctx.gos3_session_id, resourceOf(req));
      } catch (e) {
        return this.deny(req, startedAt, "ONBOARD_REQUIRED", (e as Error).message, connectorId);
      }
    }

    // 4. Sandbox / limits.
    const sandbox = this.sandboxes.get(req.ctx.sandbox_id ?? "sandbox-default") ?? DEFAULT_SANDBOX;

    const connector = this.connectors.get(connectorId);
    if (!connector) {
      return this.deny(req, startedAt, "POLICY_DENIED", `unknown connector '${connectorId}'`, connectorId);
    }

    // 5. Execution, bounded by sandbox timeout.
    let output: unknown;
    let status: import("./types.js").VortexStatus;
    // `executed` means "connector.{inspect,propose,execute}() was actually
    // invoked", NOT "status === success". Once dispatch() starts, the
    // attempt genuinely happened even if it later throws or times out —
    // conflating the two hides real (possibly partial) effects behind a
    // false "nothing was tried" signal (see spec §18, Failure semantics).
    let executed = false;
    try {
      output = await withTimeout(sandbox, () => {
        executed = true; // dispatch is about to be invoked — mark before awaiting it
        return this.dispatch(connector, req, sandbox);
      });
      status = req.kind === "execute" || req.kind === "branch.write" ? "EXECUTION_SUCCESS" : "AUTHORIZED";
    } catch (e) {
      const err = e instanceof VortexError ? e : new VortexError("EXECUTION_ERROR", (e as Error).message);
      output = { error: err.message };
      status = err.status;
      // executed stays true: dispatch() was called before this branch could
      // be reached (either it threw synchronously-inside-async, or the
      // sandbox timeout fired after dispatch had already started).
    }

    // request_id was already reserved atomically at step 1 — no separate
    // consume() call here (that gap was the race condition).

    const completedAt = new Date();
    const proof = buildAndSignProof({
      requestId: req.request_id,
      runtimeId: this.runtimeId,
      connectorId,
      operation: req.operation,
      ctx: { ...req.ctx, sandbox_id: sandbox.sandbox_id },
      input: req.args,
      output,
      executed,
      status,
      startedAt,
      completedAt,
      keypair: this.keypair,
    });

    return { status, output, execution_proof: proof };
  }

  private async dispatch(connector: VortexConnector, req: VortexRequest, sandbox: SandboxScope): Promise<unknown> {
    switch (req.kind) {
      case "inspect":
        return connector.inspect(req.operation, req.args, sandbox);
      case "propose":
        return connector.propose(req.operation, req.args, sandbox);
      case "execute":
      case "branch.write":
        return connector.execute(req.operation, req.args, sandbox);
      case "verify":
        throw new VortexError("POLICY_DENIED", "verify is handled by the verifier module, not a connector");
      default:
        throw new VortexError("POLICY_DENIED", `unknown operation kind`);
    }
  }

  private deny(
    req: VortexRequest,
    startedAt: Date,
    status: import("./types.js").VortexStatus,
    reason: string,
    connectorId: string,
  ): VortexResponse {
    // request_id reservation is handled exclusively by reserve() at step 1
    // of handle() now — deny() never needs to touch the replay store.
    const completedAt = new Date();
    const proof = buildAndSignProof({
      requestId: req.request_id,
      runtimeId: this.runtimeId,
      connectorId,
      operation: req.operation,
      ctx: req.ctx,
      input: req.args,
      output: { error: reason },
      executed: false,
      status,
      startedAt,
      completedAt,
      keypair: this.keypair,
    });
    return { status, output: { error: reason }, execution_proof: proof };
  }
}

function resourceOf(req: VortexRequest): string {
  const repo = req.ctx.scope["repository"];
  return typeof repo === "string" ? `repo:${repo}` : "resource:unknown";
}

export { assertAuthorized };
