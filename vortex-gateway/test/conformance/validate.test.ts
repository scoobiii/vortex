// GOS3 · Vortex Foundation conformance artifact
import { test } from "node:test";
import assert from "node:assert/strict";
import { validateInvokeRequest, isInvokeRequest } from "../../src/validate.js";

const VALID = { request_id: "r1", connector_id: "echo", operation: "ping", input: {} };

test("VALIDATE: a well-formed request is valid", () => {
  const result = validateInvokeRequest(VALID);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
  assert.equal(isInvokeRequest(VALID), true);
});

test("VALIDATE: non-object payloads are rejected", () => {
  for (const bad of [null, "string", 42, true, ["array"]]) {
    const result = validateInvokeRequest(bad);
    assert.equal(result.valid, false);
    assert.equal(isInvokeRequest(bad), false);
  }
});

test("VALIDATE: missing/invalid request_id is rejected", () => {
  assert.equal(validateInvokeRequest({ ...VALID, request_id: "" }).valid, false);
  assert.equal(validateInvokeRequest({ ...VALID, request_id: 123 }).valid, false);
  const { request_id, ...rest } = VALID;
  assert.equal(validateInvokeRequest(rest).valid, false);
});

test("VALIDATE: missing/invalid connector_id is rejected", () => {
  assert.equal(validateInvokeRequest({ ...VALID, connector_id: "" }).valid, false);
  assert.equal(validateInvokeRequest({ ...VALID, connector_id: 7 }).valid, false);
});

test("VALIDATE: missing/invalid operation is rejected", () => {
  assert.equal(validateInvokeRequest({ ...VALID, operation: "" }).valid, false);
  assert.equal(validateInvokeRequest({ ...VALID, operation: 7 }).valid, false);
});

test("VALIDATE: input is required (but null is an explicit valid value)", () => {
  const { input, ...rest } = VALID;
  assert.equal(validateInvokeRequest(rest).valid, false);
  assert.equal(validateInvokeRequest({ ...VALID, input: null }).valid, true);
});

test("VALIDATE: credential_id, if present, must be a string", () => {
  assert.equal(validateInvokeRequest({ ...VALID, credential_id: "c1" }).valid, true);
  assert.equal(validateInvokeRequest({ ...VALID, credential_id: 5 }).valid, false);
});

test("VALIDATE: timeout_ms, if present, must be a positive finite number", () => {
  assert.equal(validateInvokeRequest({ ...VALID, timeout_ms: 1000 }).valid, true);
  assert.equal(validateInvokeRequest({ ...VALID, timeout_ms: 0 }).valid, false);
  assert.equal(validateInvokeRequest({ ...VALID, timeout_ms: -5 }).valid, false);
  assert.equal(validateInvokeRequest({ ...VALID, timeout_ms: Number.NaN }).valid, false);
  assert.equal(validateInvokeRequest({ ...VALID, timeout_ms: "1000" }).valid, false);
});

test("VALIDATE: metadata, if present, must be a JSON object", () => {
  assert.equal(validateInvokeRequest({ ...VALID, metadata: { a: 1 } }).valid, true);
  assert.equal(validateInvokeRequest({ ...VALID, metadata: null }).valid, false);
  assert.equal(validateInvokeRequest({ ...VALID, metadata: [1, 2] }).valid, false);
  assert.equal(validateInvokeRequest({ ...VALID, metadata: "nope" }).valid, false);
});

test("VALIDATE: multiple violations are all reported", () => {
  const result = validateInvokeRequest({ request_id: "", connector_id: "", operation: "" });
  assert.equal(result.valid, false);
  assert.ok(result.errors.length >= 3);
});
