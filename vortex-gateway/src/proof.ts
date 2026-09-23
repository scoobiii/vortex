// GOS3 · Vortex Foundation conformance artifact
import { canonicalize, hashValue, sha256Hex } from "./canonicalize.js";
import type { ExecutionProof, ExecutionStatus } from "./types.js";

export interface BuildProofArgs {
  request_id: string;
  connector_id: string;
  operation: string;
  executed: boolean;
  status: ExecutionStatus;
  input: unknown;
  output: unknown | null;
  started_at: Date;
  completed_at: Date;
  runtime_id: string;
  credential_id: string | null;
}

/**
 * Builds a hash-committed ExecutionProof. The proof always exists — for
 * rejected requests (auth/validation/credential failures) executed=false
 * and output_hash=null, but request_id/connector_id/operation/status are
 * still committed. "No step may be skipped" applies to observation too:
 * a rejection is itself an observable event.
 */
export function buildProof(args: BuildProofArgs): ExecutionProof {
  const input_hash = hashValue(args.input);
  // output_hash reflects whether real output exists, independent of `executed`.
  // executed=true with status=ERROR/TIMEOUT still has output=null (the connector
  // never produced a result) — that must NOT be confused with "no attempt was made".
  const output_hash = args.output !== null && args.output !== undefined ? hashValue(args.output) : null;
  const duration_ms = args.completed_at.getTime() - args.started_at.getTime();

  const body = {
    proof_version: "vortex-gateway/1" as const,
    request_id: args.request_id,
    connector_id: args.connector_id,
    operation: args.operation,
    executed: args.executed,
    status: args.status,
    input_hash,
    output_hash,
    started_at: args.started_at.toISOString(),
    completed_at: args.completed_at.toISOString(),
    duration_ms,
    runtime_id: args.runtime_id,
    credential_id: args.credential_id,
  };

  const proof_hash = "sha256:" + sha256Hex(canonicalize(body));

  return { ...body, proof_hash };
}

/**
 * Re-derives proof_hash from a proof's own body and compares it to the
 * carried value. Used by tamper tests and by any downstream consumer that
 * wants to detect a proof that was edited after the fact — without needing
 * a signature. (Cryptographic signing of the proof, if required, is layered
 * on top by the caller — e.g. Vortex MCP's identity.ts — and is out of the
 * Gateway's normative scope; see spec/execution-proof.md.)
 */
export function verifyProofIntegrity(proof: ExecutionProof): boolean {
  const { proof_hash, ...body } = proof;
  return "sha256:" + sha256Hex(canonicalize(body)) === proof_hash;
}
