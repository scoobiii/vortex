import crypto from "node:crypto";

export type AgentCapability =
  | "sandbox.javascript"
  | "sandbox.python"
  | "tool.execution"
  | "github.connector"
  | "github.mcp"
  | "network.x"
  | "gcloud";

export interface CapabilityProof {
  capability: AgentCapability;
  executionId: string;
  evidenceId: string;
  runtimeId: string;
  success: boolean;
  observedAt: string;
}

export interface AgentAdmissionRequest {
  agentId: string;
  requiredCapabilities: AgentCapability[];
  proofs: CapabilityProof[];
}

export interface AgentAdmissionResult {
  status: "TOOLING_READY" | "BLOCKED";
  agentId: string;
  missingCapabilities: AgentCapability[];
  invalidProofs: string[];
  admissionEvidence: string;
}

function validId(value: string): boolean {
  return typeof value === "string" && value.trim().length >= 8;
}

/**
 * Fail-closed admission gate. It never infers a capability from model/provider
 * identity and never accepts a declarative "executed=true" claim.
 */
export function admitAgent(request: AgentAdmissionRequest): AgentAdmissionResult {
  const invalidProofs: string[] = [];
  const now = Date.now();

  for (const proof of request.proofs) {
    if (!validId(proof.executionId)) invalidProofs.push(`${proof.capability}:missing_execution_id`);
    if (!validId(proof.evidenceId)) invalidProofs.push(`${proof.capability}:missing_evidence_id`);
    if (!validId(proof.runtimeId)) invalidProofs.push(`${proof.capability}:missing_runtime_id`);
    if (!proof.success) invalidProofs.push(`${proof.capability}:execution_failed`);

    const observed = Date.parse(proof.observedAt);
    if (!Number.isFinite(observed) || Math.abs(now - observed) > 24 * 60 * 60 * 1000) {
      invalidProofs.push(`${proof.capability}:proof_expired_or_invalid_timestamp`);
    }
  }

  const successful = new Set(
    request.proofs
      .filter((proof) => proof.success && validId(proof.executionId) && validId(proof.evidenceId) && validId(proof.runtimeId))
      .map((proof) => proof.capability),
  );

  const missingCapabilities = request.requiredCapabilities.filter((capability) => !successful.has(capability));
  const status = invalidProofs.length === 0 && missingCapabilities.length === 0 ? "TOOLING_READY" : "BLOCKED";

  const admissionEvidence = crypto
    .createHash("sha256")
    .update(JSON.stringify({
      agentId: request.agentId,
      requiredCapabilities: [...request.requiredCapabilities].sort(),
      proofs: request.proofs.map(({ capability, executionId, evidenceId, runtimeId, success, observedAt }) => ({
        capability, executionId, evidenceId, runtimeId, success, observedAt,
      })),
      status,
      missingCapabilities,
      invalidProofs,
    }))
    .digest("hex");

  return { status, agentId: request.agentId, missingCapabilities, invalidProofs, admissionEvidence };
}
