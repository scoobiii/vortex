#!/usr/bin/env node
/** Negative security tests for the Qwen execution-proof gate. */
const assert = require("node:assert/strict");
const { validateProof, sha256, canonical, evidenceHash } = require("./verify_qwen_proof");

const prompt = "Write a JavaScript function that returns the nth Fibonacci number. Keep it concise and include one example call.";
const output = "function fib(n) { return n < 2 ? n : fib(n - 1) + fib(n - 2); }\nfib(7);";
const base = {
  schema: "vortex.execution-proof.v1", request_hash: "r", prompt_sha256: sha256(prompt),
  direct: { invocation_id: "proof-direct-001", executed: true, exit_code: 0, duration_ms: 10, completion_tokens: 5, tok_per_s: 500, request_hash: "r", stdout_hash: "ds", output_hash: sha256(output), output },
  vortex: { invocation_id: "proof-vortex-001", executed: true, exit_code: 0, duration_ms: 11, completion_tokens: 5, tok_per_s: 454, request_hash: "r", stdout_hash: "vs", output: { text: output, output_hash: sha256(output), stdout_hash: "vs" } },
  comparison: { same_request: true, deterministic: true, same_output: true, overhead_ms: 1, overhead_percent: 10, evidence_present: true },
};
base.vortex.execution_evidence = {
  response_id: "chatcmpl-test", request_hash: "r", stdout_hash: "vs", output_hash: sha256(output),
  invocation_id: "proof-vortex-001", executed: true, exit_code: 0, completion_tokens: 5,
};
base.vortex.execution_evidence.evidence_hash = evidenceHash(base.vortex.execution_evidence);

function mustFail(mutated, label) {
  const failures = validateProof(mutated);
  assert.ok(failures.length > 0, `${label}: verifier accepted tampered proof`);
}

const hashTampered = structuredClone(base);
hashTampered.vortex.execution_evidence.evidence_hash = "00".repeat(32);
mustFail(hashTampered, "hash adulterado");

const requestTampered = structuredClone(base);
requestTampered.vortex.request_hash = "tampered-request";
mustFail(requestTampered, "request adulterado");

const invocationTampered = structuredClone(base);
invocationTampered.vortex.invocation_id = "tampered-invocation";
mustFail(invocationTampered, "invocation adulterado");

const outputTampered = structuredClone(base);
outputTampered.vortex.output.text = "tampered output";
mustFail(outputTampered, "output adulterado");

const noEvidence = structuredClone(base);
noEvidence.vortex.execution_evidence = null;
mustFail(noEvidence, "executed=true sem evidência");

console.log("PASS qwen proof negative security tests: 5/5");
