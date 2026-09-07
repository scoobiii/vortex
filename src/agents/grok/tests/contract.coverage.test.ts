/**
 * GOS3 · agente: scoobiii · papel: CI contract coverage
 * Objetivo: exercitar todos os ramos do invocation contract v0.1.
 */
import assert from "node:assert/strict";
import { validateRequest, validateResponse, isContractCompliant } from "../adapter/contract";

const req = { invocation_id: "cov-1", agent: "grok", action: "ping", payload: {} };
const res = { invocation_id: "cov-1", agent: "grok", executed: true, result: null, error: null, logs: [], duration_ms: 1 };

function rejects(fn: () => unknown, message: string) {
  assert.throws(fn, (e: unknown) => e instanceof Error && e.message === message);
}

// validateRequest: object guard + every field/type branch.
validateRequest(req);
rejects(() => validateRequest(null), "Request deve ser um objeto");
rejects(() => validateRequest(undefined), "Request deve ser um objeto");
rejects(() => validateRequest({ ...req, invocation_id: "" }), "invocation_id é obrigatório e deve ser string não-vazia");
rejects(() => validateRequest({ ...req, invocation_id: 1 }), "invocation_id é obrigatório e deve ser string não-vazia");
rejects(() => validateRequest({ ...req, agent: "" }), "agent é obrigatório e deve ser string não-vazia");
rejects(() => validateRequest({ ...req, agent: 1 }), "agent é obrigatório e deve ser string não-vazia");
rejects(() => validateRequest({ ...req, action: "" }), "action é obrigatório e deve ser string não-vazia");
rejects(() => validateRequest({ ...req, action: 1 }), "action é obrigatório e deve ser string não-vazia");
rejects(() => validateRequest({ ...req, payload: null }), "payload é obrigatório e deve ser objeto");
rejects(() => validateRequest({ ...req, payload: "bad" }), "payload é obrigatório e deve ser objeto");

// validateResponse: object guard + every validation branch.
validateResponse(res);
rejects(() => validateResponse(null), "Response deve ser um objeto");
rejects(() => validateResponse(undefined), "Response deve ser um objeto");
rejects(() => validateResponse({ ...res, invocation_id: 1 }), "response.invocation_id deve ser string");
rejects(() => validateResponse({ ...res, agent: 1 }), "response.agent deve ser string");
rejects(() => validateResponse({ ...res, executed: "true" }), "response.executed é OBRIGATÓRIO e deve ser boolean (contrato v0.1)");
const missingResult = { ...res } as Record<string, unknown>; delete missingResult.result;
rejects(() => validateResponse(missingResult), "response.result é obrigatório (pode ser null)");
const missingError = { ...res } as Record<string, unknown>; delete missingError.error;
rejects(() => validateResponse(missingError), "response.error é obrigatório (pode ser null)");
rejects(() => validateResponse({ ...res, logs: "bad" }), "response.logs deve ser array");
rejects(() => validateResponse({ ...res, duration_ms: "1" }), "response.duration_ms deve ser number");
validateResponse({ ...res, result: { ok: true }, error: "failure", logs: ["x"], duration_ms: 0 });

// isContractCompliant: success + caught failure.
assert.equal(isContractCompliant(res), true);
assert.equal(isContractCompliant({ ...res, executed: false }), true);
assert.equal(isContractCompliant({ ...res, logs: null } as any), false);
assert.equal(isContractCompliant(null as any), false);

console.log("contract coverage assertions: PASS");
