// GOS3 · Vortex Foundation conformance artifact
/**
 * Vortex MCP — Core normative types.
 * Mirrors spec/execution-proof.md, spec/authorization.md, spec/sandbox.md.
 */

export type VortexOperationKind =
  | "inspect"
  | "propose"
  | "verify"
  | "execute"
  | "branch.write";

export type VortexStatus =
  | "AUTHORIZED"
  | "REJECTED"
  | "ONBOARD_REQUIRED"
  | "POLICY_DENIED"
  | "SANDBOX_DENIED"
  | "EXECUTION_STARTED"
  | "EXECUTION_SUCCESS"
  | "EXECUTION_ERROR"
  | "EXECUTION_TIMEOUT"
  | "VERIFICATION_FAILED"
  | "IDENTITY_INVALID"
  | "REPLAY_REJECTED";

/** spec/authorization.md §7 */
export interface AuthorizationContext {
  principal_id: string;
  agent_id: string;
  policy_id: string;
  policy_version: string;
  capability: string;
  scope: Record<string, unknown>;
  gos3_session_id?: string;
  sandbox_id?: string;
}

/** spec/sandbox.md §9 — observable bounds, not an implementation mechanism */
export interface SandboxScope {
  sandbox_id: string;
  filesystem_scope: string[]; // allowed path prefixes, absolute
  network_scope: string[]; // allowed hosts, [] = none
  process_scope: string[]; // allowed executables, [] = none
  credential_scope: string[]; // allowed credential ids, [] = none
  resource_limits: {
    timeout_ms: number;
    memory_mb?: number;
    cpu_percent?: number;
  };
}

/** spec/gos3.md — resource onboarding contract, NOT cryptographic proof */
export interface Gos3Session {
  gos3_session_id: string;
  principal_id: string;
  agent_id: string;
  resources: string[]; // resource URIs onboarded for this session
  issued_at: string;
  expires_at: string;
}

/** spec/identity.md */
export interface VortexIdentity {
  agent_id: string;
  principal_id: string;
  key_id: string;
  algorithm: "Ed25519";
  public_key: string; // base64, spki-less raw or exported per key-discovery.md
}

/** spec/capability.md (declared by connectors) */
export interface CapabilityDeclaration {
  capability: string; // e.g. "repository.write"
  scope: Record<string, unknown>;
  side_effect: boolean;
  approval: "automatic" | "required" | "prohibited";
}

/** spec/execution-proof.md §10 — the canonical, signable record */
export interface ExecutionProofUnsigned {
  proof_version: "1";

  request_id: string;
  execution_id: string;
  runtime_id: string;

  agent_id: string;
  principal_id: string;

  connector_id: string;
  operation: string;

  executed: boolean;
  status: VortexStatus;

  input_hash: string; // sha256:<hex>
  output_hash: string; // sha256:<hex>

  started_at: string;
  completed_at: string;
  duration_ms: number;

  policy_id: string;
  policy_version: string;

  gos3_session_id: string | null;
  sandbox_id: string | null;

  identity: {
    key_id: string;
    algorithm: "Ed25519";
  };
}

export interface ExecutionProof extends ExecutionProofUnsigned {
  signature: string; // base64
}

/** spec/policy.md — minimal per-operation policy table */
export interface VortexPolicy {
  policy_id: string;
  policy_version: string;
  rules: Record<
    string,
    {
      approval: "automatic" | "required" | "prohibited";
      allowed_scopes?: Record<string, unknown>;
    }
  >;
}

export class VortexError extends Error {
  constructor(
    public readonly status: VortexStatus,
    message: string,
  ) {
    super(message);
    this.name = "VortexError";
  }
}
