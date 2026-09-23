import { test } from "node:test";
import assert from "node:assert/strict";
import { makeEngineFixture, ctxFor } from "../helpers.js";
import { verifyExecutionProof } from "../../src/verifier.js";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

test("FORGE: honest proof verifies", async () => {
  const { engine, connector, registry, sandboxRoot } = makeEngineFixture();
  const path = join(sandboxRoot, "readme.txt");
  writeFileSync(path, "hello");

  const res = await engine.handle(
    { request_id: "req-1", operation: "repository.read", kind: "inspect", ctx: ctxFor(), args: { path } },
    connector.connectorId,
  );
  const result = verifyExecutionProof(res.execution_proof, registry);
  assert.equal(result.ok, true);
});

for (const field of ["output_hash", "executed", "request_id", "agent_id", "policy_id"] as const) {
  test(`FORGE: tampering '${field}' invalidates signature`, async () => {
    const { engine, connector, registry, sandboxRoot } = makeEngineFixture();
    const path = join(sandboxRoot, "readme.txt");
    writeFileSync(path, "hello");

    const res = await engine.handle(
      { request_id: `req-forge-${field}`, operation: "repository.read", kind: "inspect", ctx: ctxFor(), args: { path } },
      connector.connectorId,
    );

    const tampered = { ...res.execution_proof } as Record<string, unknown>;
    tampered[field] = typeof tampered[field] === "boolean" ? !tampered[field] : `${tampered[field]}-tampered`;

    const result = verifyExecutionProof(tampered as any, registry);
    // Any tampering with a signed field must be caught — either as a
    // signature mismatch (VERIFICATION_FAILED) or, for identity-bearing
    // fields, as an identity/key-binding mismatch (IDENTITY_INVALID).
    // What is never acceptable is `ok: true`.
    assert.equal(result.ok, false);
    assert.ok(
      (result as any).status === "VERIFICATION_FAILED" || (result as any).status === "IDENTITY_INVALID",
      `unexpected status: ${(result as any).status}`,
    );
  });
}
