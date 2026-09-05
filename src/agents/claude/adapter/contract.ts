/**
 * Data:            2026-08-15
 * Diretório:       src/agents/claude/adapter/contract.ts
  * Responsabilidade: Valida request/response do invocation-contract v0.1 para o agente Claude.
 * Versão:          1.0.0
 * Assinatura:      scoobiii <sobrinhosj@gmail.com>
 */


/**
 * GOS3 · agente: Claude · papel: Arquiteto / Tech Writer (ver docs/team.md)
 * fase: Technical Refinement (E2) · data: 2026-08-17 · hora: 22:40:00 -03:00
 * antes: sem validação própria — dependia de spec/invocation-contract.md (rascunho fora do padrão)
 * depois: validação alinhada ao specs/invocation-contract.md v0.1 real (root), mesma lógica do Grok
 * base: commit 75973a3
 * assinatura: Claude · Arquiteto / Tech Writer · GOS3
 */
/**
 * Validação do invocation-contract.md v0.1
 */

import { InvocationRequest, InvocationResponse } from "./types";

export function validateRequest(req: unknown): asserts req is InvocationRequest {
  if (!req || typeof req !== "object") {
    throw new Error("Request deve ser um objeto");
  }

  const r = req as Record<string, unknown>;

  if (typeof r.invocation_id !== "string" || !r.invocation_id) {
    throw new Error("invocation_id é obrigatório e deve ser string não-vazia");
  }
  if (typeof r.agent !== "string" || !r.agent) {
    throw new Error("agent é obrigatório e deve ser string não-vazia");
  }
  if (typeof r.action !== "string" || !r.action) {
    throw new Error("action é obrigatório e deve ser string não-vazia");
  }
  if (typeof r.payload !== "object" || r.payload === null) {
    throw new Error("payload é obrigatório e deve ser objeto");
  }
}

export function validateResponse(res: unknown): asserts res is InvocationResponse {
  if (!res || typeof res !== "object") {
    throw new Error("Response deve ser um objeto");
  }

  const r = res as Record<string, unknown>;

  if (typeof r.invocation_id !== "string") {
    throw new Error("response.invocation_id deve ser string");
  }
  if (typeof r.agent !== "string") {
    throw new Error("response.agent deve ser string");
  }
  if (typeof r.executed !== "boolean") {
    throw new Error("response.executed é OBRIGATÓRIO e deve ser boolean (contrato v0.1)");
  }
  if (!("result" in r)) {
    throw new Error("response.result é obrigatório (pode ser null)");
  }
  if (!("error" in r)) {
    throw new Error("response.error é obrigatório (pode ser null)");
  }
  if (!Array.isArray(r.logs)) {
    throw new Error("response.logs deve ser array");
  }
  if (typeof r.duration_ms !== "number") {
    throw new Error("response.duration_ms deve ser number");
  }
}

export function isContractCompliant(res: InvocationResponse): boolean {
  try {
    validateResponse(res);
    return true;
  } catch {
    return false;
  }
}
