import { verifyProofSignature } from "./identity.js";
import type { KeyRegistry } from "./key-registry.js";
import type { ExecutionProof } from "./types.js";

export type VerificationResult =
  | { ok: true }
  | { ok: false; status: "VERIFICATION_FAILED" | "IDENTITY_INVALID" | "REPLAY_REJECTED"; reason: string };

const REQUIRED_FIELDS: (keyof ExecutionProof)[] = [
  "proof_version",
  "request_id",
  "execution_id",
  "runtime_id",
  "agent_id",
  "principal_id",
  "connector_id",
  "operation",
  "executed",
  "status",
  "input_hash",
  "output_hash",
  "started_at",
  "completed_at",
  "duration_ms",
  "policy_id",
  "policy_version",
  "gos3_session_id",
  "sandbox_id",
  "identity",
  "signature",
];

/**
 * Verifies an ExecutionProof independently of the runtime that
 * produced it. Checks, in order: schema completeness, key discovery,
 * signature validity over the JCS-canonicalized unsigned proof, and
 * basic replay bookkeeping if a seenRequestIds set is supplied.
 */
export function verifyExecutionProof(
  proof: ExecutionProof,
  registry: KeyRegistry,
  seenRequestIds?: Set<string>,
): VerificationResult {
  for (const field of REQUIRED_FIELDS) {
    if (!(field in proof)) {
      return { ok: false, status: "VERIFICATION_FAILED", reason: `missing field '${String(field)}'` };
    }
  }

  if (proof.proof_version !== "1") {
    return { ok: false, status: "VERIFICATION_FAILED", reason: `unsupported proof_version '${proof.proof_version}'` };
  }

  const keyEntry = registry.lookup(proof.identity.key_id);
  if (!keyEntry) {
    return { ok: false, status: "IDENTITY_INVALID", reason: `key_id '${proof.identity.key_id}' not found in registry` };
  }
  if (keyEntry.agent_id !== proof.agent_id || keyEntry.principal_id !== proof.principal_id) {
    return {
      ok: false,
      status: "IDENTITY_INVALID",
      reason: `key_id '${proof.identity.key_id}' is bound to a different agent_id/principal_id than the proof claims`,
    };
  }

  const valid = verifyProofSignature(proof, keyEntry.public_key);
  if (!valid) {
    return { ok: false, status: "VERIFICATION_FAILED", reason: "signature does not verify against registered public key" };
  }

  if (seenRequestIds) {
    if (seenRequestIds.has(proof.request_id)) {
      return { ok: false, status: "REPLAY_REJECTED", reason: `request_id '${proof.request_id}' already verified once` };
    }
    seenRequestIds.add(proof.request_id);
  }

  return { ok: true };
}
