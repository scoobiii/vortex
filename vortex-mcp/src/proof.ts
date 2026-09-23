import { randomUUID } from "node:crypto";
import { jcs, sha256Tagged } from "./canonicalize.js";
import { signProof } from "./identity.js";
import type { Ed25519Keypair } from "./identity.js";
import type { AuthorizationContext, ExecutionProof, VortexStatus } from "./types.js";

export interface BuildProofInput {
  requestId: string;
  runtimeId: string;
  connectorId: string;
  operation: string;
  ctx: AuthorizationContext;
  input: unknown;
  output: unknown;
  executed: boolean;
  status: VortexStatus;
  startedAt: Date;
  completedAt: Date;
  keypair: Ed25519Keypair;
}

export function buildAndSignProof(p: BuildProofInput): ExecutionProof {
  const unsigned = {
    proof_version: "1" as const,

    request_id: p.requestId,
    execution_id: `exec-${randomUUID()}`,
    runtime_id: p.runtimeId,

    agent_id: p.ctx.agent_id,
    principal_id: p.ctx.principal_id,

    connector_id: p.connectorId,
    operation: p.operation,

    executed: p.executed,
    status: p.status,

    input_hash: sha256Tagged(jcs(p.input)),
    output_hash: sha256Tagged(jcs(p.output)),

    started_at: p.startedAt.toISOString(),
    completed_at: p.completedAt.toISOString(),
    duration_ms: p.completedAt.getTime() - p.startedAt.getTime(),

    policy_id: p.ctx.policy_id,
    policy_version: p.ctx.policy_version,

    gos3_session_id: p.ctx.gos3_session_id ?? null,
    sandbox_id: p.ctx.sandbox_id ?? null,

    identity: {
      key_id: p.keypair.keyId,
      algorithm: "Ed25519" as const,
    },
  };

  return signProof(unsigned, p.keypair);
}
