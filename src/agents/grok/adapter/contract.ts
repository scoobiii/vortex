/**
 * GOS3 · agente: GPT · papel: Engineering Agent / Grok Adapter
 * fase: Sprint Proof-of-Execution · data: 2026-09-06
 * assinatura: GPT · GOS3
 */

import { createHash } from "crypto";
import { InvocationRequest, InvocationResponse, ExecutionReceipt } from "./types";

export function canonicalReceipt(receipt: ExecutionReceipt): string {
  return JSON.stringify({
    invocation_id: receipt.invocation_id,
    agent: receipt.agent,
    action: receipt.action,
    started_at: receipt.started_at,
    finished_at: receipt.finished_at,
    duration_ms: receipt.duration_ms,
    exit_code: receipt.exit_code,
    effect_observed: receipt.effect_observed,
    effect_kind: receipt.effect_kind,
    effect_fingerprint: receipt.effect_fingerprint,
  });
}

export function computeEvidenceHash(receipt: ExecutionReceipt): string {
  return createHash("sha256").update(canonicalReceipt(receipt)).digest("hex");
}

export function validateRequest(req: unknown): asserts req is InvocationRequest {
  if (!req || typeof req !== "object") throw new Error("Request deve ser um objeto");
  const r = req as Record<string, unknown>;
  if (typeof r.invocation_id !== "string" || !r.invocation_id) throw new Error("invocation_id é obrigatório e deve ser string não-vazia");
  if (typeof r.agent !== "string" || !r.agent) throw new Error("agent é obrigatório e deve ser string não-vazia");
  if (typeof r.action !== "string" || !r.action) throw new Error("action é obrigatório e deve ser string não-vazia");
  if (typeof r.payload !== "object" || r.payload === null) throw new Error("payload é obrigatório e deve ser objeto");
}

function validateReceipt(receipt: unknown): asserts receipt is ExecutionReceipt {
  if (!receipt || typeof receipt !== "object") throw new Error("response.receipt é obrigatório para executed=true");
  const r = receipt as Record<string, unknown>;
  const strings = ["invocation_id", "agent", "action", "started_at", "finished_at", "effect_kind", "effect_fingerprint"];
  for (const key of strings) if (typeof r[key] !== "string" || !r[key]) throw new Error(`receipt.${key} inválido`);
  if (typeof r.duration_ms !== "number" || r.duration_ms < 0) throw new Error("receipt.duration_ms inválido");
  if (typeof r.exit_code !== "number") throw new Error("receipt.exit_code inválido");
  if (typeof r.effect_observed !== "boolean") throw new Error("receipt.effect_observed inválido");
  if (!r.effect_observed) throw new Error("executed=true exige effect_observed=true");
  if (r.exit_code !== 0) throw new Error("executed=true exige exit_code=0");
}

export function validateResponse(res: unknown): asserts res is InvocationResponse {
  if (!res || typeof res !== "object") throw new Error("Response deve ser um objeto");
  const r = res as Record<string, unknown>;
  if (typeof r.invocation_id !== "string") throw new Error("response.invocation_id deve ser string");
  if (typeof r.agent !== "string") throw new Error("response.agent deve ser string");
  if (typeof r.executed !== "boolean") throw new Error("response.executed é OBRIGATÓRIO e deve ser boolean");
  if (!("result" in r)) throw new Error("response.result é obrigatório (pode ser null)");
  if (!("error" in r)) throw new Error("response.error é obrigatório (pode ser null)");
  if (!Array.isArray(r.logs)) throw new Error("response.logs deve ser array");
  if (typeof r.duration_ms !== "number") throw new Error("response.duration_ms deve ser number");

  if (r.executed) {
    validateReceipt(r.receipt);
    if (typeof r.evidence_hash !== "string" || !r.evidence_hash) throw new Error("executed=true exige evidence_hash");
    const expected = computeEvidenceHash(r.receipt);
    if (r.evidence_hash !== expected) throw new Error(`evidence_hash inválido: recebido=${r.evidence_hash} esperado=${expected}`);
  } else if (r.evidence_hash !== null || r.receipt !== null) {
    throw new Error("executed=false não pode carregar receipt/evidence_hash de execução");
  }
}

export function isContractCompliant(res: InvocationResponse): boolean {
  try { validateResponse(res); return true; } catch { return false; }
}
