// **GOS3** · agente: `MetaAI`
import crypto from "node:crypto";
export function hashResult(result: any): string {
  return crypto.createHash("sha256").update(JSON.stringify(result)).digest("hex");
}
export function validateEvidence(r: any): boolean {
  return typeof r?.evidence?.result_hash === "string" && typeof r?.runtime_id === "string";
}
