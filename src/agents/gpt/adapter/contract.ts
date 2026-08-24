// **GOS3** · agente: GPT · papel: Adapter contract
import crypto from "node:crypto";
import { InvocationRequest, InvocationResponse, RuntimeObservation } from "./types";

export function computeEvidenceHash(output: { stdout: string; stderr: string; exit_code: number }, duration_ms: number): string {
  const payload = `${output.stdout}${output.stderr}${output.exit_code}${duration_ms}`;
  return crypto.createHash("sha256").update(payload, "utf8").digest("hex");
}

export function validateRequest(raw: unknown): asserts raw is InvocationRequest {
  if (!raw || typeof raw !== "object") throw new Error("request must be an object");
  const r = raw as Partial<InvocationRequest>;
  if (r.contract_version !== "0.1") throw new Error("contract_version must be 0.1");
  if (typeof r.invocation_id !== "string" || !r.invocation_id) throw new Error("invocation_id required");
  if (r.agent !== "gpt") throw new Error('agent must be "gpt"');
  if (typeof r.action !== "string" || !r.action) throw new Error("action required");
  if (!r.payload || typeof r.payload !== "object") throw new Error("payload required");
}

export function validateRuntimeObservation(o: RuntimeObservation): void {
  if (!o.runtime_id || !o.execution_id || !o.recorded_at) throw new Error("runtime observation identity missing");
  if (!Number.isInteger(o.exit_code)) throw new Error("runtime exit_code must be integer");
  if (!Number.isFinite(o.duration_ms) || o.duration_ms < 0) throw new Error("runtime duration_ms invalid");
  const expected = computeEvidenceHash(o, o.duration_ms);
  if (o.evidence_hash !== expected) throw new Error("runtime evidence_hash mismatch");
}

export function validateResponse(r: InvocationResponse): void {
  if (r.contract_version !== "0.1") throw new Error("invalid contract version");
  if (r.agent !== "gpt") throw new Error("invalid agent");
  if (r.executed === true) {
    if (r.status !== "success") throw new Error("executed=true requires status=success");
    if (!r.runtime) throw new Error("executed=true requires runtime observation");
    validateRuntimeObservation(r.runtime);
    if (r.evidence_hash !== r.runtime.evidence_hash) throw new Error("response evidence does not match runtime evidence");
  }
  if (r.executed === false && r.status === "success") throw new Error("executed=false cannot be success");
}
