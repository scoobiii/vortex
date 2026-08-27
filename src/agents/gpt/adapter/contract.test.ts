// **GOS3** · agente: GPT · papel: Adapter tests
import assert from "node:assert/strict";
import { computeEvidenceHash, validateResponse, validateRuntimeObservation } from "./contract";
import { InvocationResponse, RuntimeObservation } from "./types";

function observation(): RuntimeObservation {
  const base = {
    runtime_id: "rt-test-001",
    execution_id: "exec-test-001",
    recorded_at: "2026-08-24T00:00:00.000Z",
    stdout: "42\n",
    stderr: "",
    exit_code: 0,
    duration_ms: 12,
    truncated: false,
  };
  return { ...base, evidence_hash: computeEvidenceHash(base, base.duration_ms) };
}

const obs = observation();
validateRuntimeObservation(obs);

const valid: InvocationResponse = {
  contract_version: "0.1",
  invocation_id: "inv-001",
  agent: "gpt",
  status: "success",
  executed: true,
  output: { stdout: obs.stdout, stderr: obs.stderr, exit_code: obs.exit_code },
  duration_ms: obs.duration_ms,
  truncated: false,
  evidence_hash: obs.evidence_hash,
  runtime: obs,
};
validateResponse(valid);

assert.throws(() => validateResponse({ ...valid, evidence_hash: "0".repeat(64) }));
assert.throws(() => validateResponse({ ...valid, runtime: { ...obs, evidence_hash: "0".repeat(64) } }));
assert.throws(() => validateResponse({ ...valid, executed: true, runtime: undefined }));
assert.throws(() => validateResponse({ ...valid, executed: false, status: "success" }));

console.log("GPT evidence contract PASS");
