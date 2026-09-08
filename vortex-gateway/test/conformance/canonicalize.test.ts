import { test } from "node:test";
import assert from "node:assert/strict";
import { canonicalize, hashValue, sha256Hex } from "../../src/canonicalize.js";

test("CANON: object keys are sorted regardless of insertion order", () => {
  const a = canonicalize({ b: 1, a: 2 });
  const b = canonicalize({ a: 2, b: 1 });
  assert.equal(a, b);
  assert.equal(a, '{"a":2,"b":1}');
});

test("CANON: nested arrays and objects canonicalize recursively", () => {
  const out = canonicalize({ list: [3, { z: 1, a: 2 }, null], flag: true, name: "x" });
  assert.equal(out, '{"flag":true,"list":[3,{"a":2,"z":1},null],"name":"x"}');
});

test("CANON: primitives round-trip", () => {
  assert.equal(canonicalize(null), "null");
  assert.equal(canonicalize(true), "true");
  assert.equal(canonicalize(false), "false");
  assert.equal(canonicalize("hi"), '"hi"');
  assert.equal(canonicalize(42), "42");
});

test("CANON: rejects non-finite numbers", () => {
  assert.throws(() => canonicalize(Number.NaN), TypeError);
  assert.throws(() => canonicalize(Number.POSITIVE_INFINITY), TypeError);
  assert.throws(() => canonicalize(Number.NEGATIVE_INFINITY), TypeError);
});

test("CANON: rejects values with no JSON representation", () => {
  const notJson = () => "not json"; // exercised once so it's not itself an uncovered artifact
  assert.equal(notJson(), "not json");
  assert.throws(() => canonicalize(undefined), TypeError);
  assert.throws(() => canonicalize(notJson), TypeError);
  assert.throws(() => canonicalize(Symbol("x")), TypeError);
  assert.throws(() => canonicalize(10n), TypeError);
});

test("CANON: two different inputs never collide (basic sanity)", () => {
  assert.notEqual(hashValue({ a: 1 }), hashValue({ a: 2 }));
});

test("CANON: hashValue is deterministic and sha256-prefixed", () => {
  const h1 = hashValue({ x: [1, 2, 3] });
  const h2 = hashValue({ x: [1, 2, 3] });
  assert.equal(h1, h2);
  assert.match(h1, /^sha256:[0-9a-f]{64}$/);
});

test("CANON: sha256Hex matches a known vector", () => {
  // sha256("") — well-known empty-string digest.
  assert.equal(sha256Hex(""), "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
});
