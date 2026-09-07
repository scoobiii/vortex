/**
 * GOS3 · agente: qwen · papel: Agent Adapter / Ollama
 * fase: Qwen connector reorganization · data: 2026-09-06
 * base: a9083f0 · assinatura: GPT · Engineering Agent · GOS3
 */

import { InvocationRequest, InvocationResponse } from "./types";

export function validateRequest(req: unknown): asserts req is InvocationRequest {
  if (!req || typeof req !== "object") throw new Error("Request deve ser um objeto");
  const r = req as Record<string, unknown>;
  if (typeof r.invocation_id !== "string" || !r.invocation_id) throw new Error("invocation_id é obrigatório");
  if (r.agent !== "qwen") throw new Error('agent deve ser "qwen"');
  if (typeof r.action !== "string" || !r.action) throw new Error("action é obrigatório");
  if (!r.payload || typeof r.payload !== "object" || Array.isArray(r.payload)) throw new Error("payload deve ser objeto");
}

export function validateResponse(res: unknown): asserts res is InvocationResponse {
  if (!res || typeof res !== "object") throw new Error("Response deve ser um objeto");
  const r = res as Record<string, unknown>;
  if (typeof r.invocation_id !== "string") throw new Error("response.invocation_id inválido");
  if (r.agent !== "qwen") throw new Error('response.agent deve ser "qwen"');
  if (typeof r.executed !== "boolean") throw new Error("response.executed deve ser boolean");
  if (!("result" in r)) throw new Error("response.result é obrigatório");
  if (!("error" in r)) throw new Error("response.error é obrigatório");
  if (!Array.isArray(r.logs)) throw new Error("response.logs deve ser array");
  if (typeof r.duration_ms !== "number") throw new Error("response.duration_ms deve ser number");
}

export function isContractCompliant(res: InvocationResponse): boolean {
  try { validateResponse(res); return true; } catch { return false; }
}
