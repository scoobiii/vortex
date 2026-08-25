import assert from "node:assert/strict";
import { admitAgent } from "../src/agent-admission";

const now = new Date().toISOString();

const required = ["sandbox.javascript", "sandbox.python", "tool.execution"] as const;

const proof = (capability: typeof required[number], ok = true) => ({
  capability,
  executionId: `exec-${capability}-123456`,
  evidenceId: `evid-${capability}-123456`,
  runtimeId: "vortex-test-runtime",
  success: ok,
  observedAt: now,
});

const ready = admitAgent({
  agentId: "test-agent-123456",
  requiredCapabilities: [...required],
  proofs: required.map((capability) => proof(capability)),
});
assert.equal(ready.status, "TOOLING_READY");
assert.deepEqual(ready.missingCapabilities, []);
assert.equal(ready.invalidProofs.length, 0);
assert.equal(ready.admissionEvidence.length, 64);

const blocked = admitAgent({
  agentId: "new-agent-123456",
  requiredCapabilities: [...required],
  proofs: [proof("sandbox.javascript"), proof("sandbox.python")],
});
assert.equal(blocked.status, "BLOCKED");
assert.deepEqual(blocked.missingCapabilities, ["tool.execution"]);

const failed = admitAgent({
  agentId: "failed-agent-123456",
  requiredCapabilities: [...required],
  proofs: [proof("sandbox.javascript"), proof("sandbox.python"), proof("tool.execution", false)],
});
assert.equal(failed.status, "BLOCKED");
assert.ok(failed.invalidProofs.includes("tool.execution:execution_failed"));

const fake = admitAgent({
  agentId: "fake-agent-123456",
  requiredCapabilities: [...required],
  proofs: [{
    capability: "sandbox.javascript",
    executionId: "",
    evidenceId: "",
    runtimeId: "",
    success: true,
    observedAt: now,
  }],
});
assert.equal(fake.status, "BLOCKED");
assert.ok(fake.invalidProofs.some((value) => value.endsWith(":missing_execution_id")));

console.log("PASS: GOS3 fail-closed agent admission gate");
