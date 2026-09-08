// GOS3 · Vortex Foundation conformance artifact
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildProof, verifyProofIntegrity } from "../../src/proof.js";
import { buildTestGateway } from "../helpers.js";

function baseArgs() {
  const started_at = new Date("2026-01-01T00:00:00.000Z");
  const completed_at = new Date("2026-01-01T00:00:01.500Z");
  return {
    request_id: "r1",
    connector_id: "echo",
    operation: "ping",
    executed: true,
    status: "OK" as const,
    input: { a: 1 },
    output: { b: 2 },
    started_at,
    completed_at,
    runtime_id: "rt-1",
    credential_id: null,
  };
}

test("PROOF: carries every mandatory field", () => {
  const proof = buildProof(baseArgs());
  assert.equal(proof.proof_version, "vortex-gateway/1");
  assert.equal(proof.request_id, "r1");
  assert.equal(proof.connector_id, "echo");
  assert.equal(proof.operation, "ping");
  assert.equal(proof.executed, true);
  assert.equal(proof.status, "OK");
  assert.match(proof.input_hash, /^sha256:/);
  assert.match(proof.output_hash!, /^sha256:/);
  assert.equal(proof.started_at, "2026-01-01T00:00:00.000Z");
  assert.equal(proof.completed_at, "2026-01-01T00:00:01.500Z");
  assert.equal(proof.duration_ms, 1500);
  assert.equal(proof.runtime_id, "rt-1");
  assert.equal(proof.credential_id, null);
  assert.match(proof.proof_hash, /^sha256:/);
});

test("PROOF: output_hash is null when the request was never executed", () => {
  const proof = buildProof({ ...baseArgs(), executed: false, status: "ERROR", output: null });
  assert.equal(proof.output_hash, null);
});

test("PROOF: input_hash reflects the actual input, not a placeholder", () => {
  const p1 = buildProof({ ...baseArgs(), input: { a: 1 } });
  const p2 = buildProof({ ...baseArgs(), input: { a: 2 } });
  assert.notEqual(p1.input_hash, p2.input_hash);
});

test("PROOF: verifyProofIntegrity accepts an untouched proof", () => {
  const proof = buildProof(baseArgs());
  assert.equal(verifyProofIntegrity(proof), true);
});

test("TAMPER: mutating any committed field invalidates proof_hash", () => {
  const proof = buildProof(baseArgs());
  const fields: Array<keyof typeof proof> = [
    "request_id",
    "connector_id",
    "operation",
    "executed",
    "status",
    "input_hash",
    "output_hash",
    "started_at",
    "completed_at",
    "duration_ms",
    "runtime_id",
    "credential_id",
  ];
  for (const field of fields) {
    const tampered = { ...proof, [field]: mutate(proof[field]) };
    assert.equal(
      verifyProofIntegrity(tampered),
      false,
      `tampering '${String(field)}' should invalidate the proof`
    );
  }
});

function mutate(value: unknown): unknown {
  if (typeof value === "string") return value + "-tampered";
  if (typeof value === "boolean") return !value;
  if (typeof value === "number") return value + 1;
  return "tampered";
}

test("TAMPER: post-hoc edit of proof_hash itself does not make a forged body verify", () => {
  const proof = buildProof(baseArgs());
  const forged = { ...proof, request_id: "r-forged" };
  // Attacker also tries to recompute proof_hash by hand incorrectly (off by a stray field) —
  // simplest case: they just leave proof_hash as the old (now-mismatched) value.
  assert.equal(verifyProofIntegrity(forged), false);
});

test("PROOF: invariant executed === (status === 'OK') holds for a real success", async () => {
  const { gateway } = buildTestGateway();
  const result = await gateway.invoke(
    { request_id: "r1", connector_id: "echo", operation: "ping", input: {} },
    "good-token"
  );
  assert.equal(result.proof.executed, result.proof.status === "OK");
});
