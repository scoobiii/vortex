import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { makeEngineFixture, ctxFor } from "../helpers.js";

test("REPLAY: reusing request_id at the engine is rejected", async () => {
  const { engine, connector, sandboxRoot } = makeEngineFixture();
  const path = join(sandboxRoot, "readme.txt");
  writeFileSync(path, "hello");

  const req = { request_id: "req-replay-1", operation: "repository.read", kind: "inspect" as const, ctx: ctxFor(), args: { path } };

  const first = await engine.handle(req, connector.connectorId);
  assert.equal(first.status, "AUTHORIZED");

  const second = await engine.handle(req, connector.connectorId);
  assert.equal(second.status, "REPLAY_REJECTED");
});

test("REPLAY: verifier rejects a proof whose request_id was already verified once", async () => {
  const { engine, connector, registry, sandboxRoot } = makeEngineFixture();
  const path = join(sandboxRoot, "readme.txt");
  writeFileSync(path, "hello");

  const res = await engine.handle(
    { request_id: "req-replay-2", operation: "repository.read", kind: "inspect", ctx: ctxFor(), args: { path } },
    connector.connectorId,
  );

  const { verifyExecutionProof } = await import("../../src/verifier.js");
  const seen = new Set<string>();
  const firstVerify = verifyExecutionProof(res.execution_proof, registry, seen);
  assert.equal(firstVerify.ok, true);
  const secondVerify = verifyExecutionProof(res.execution_proof, registry, seen);
  assert.equal(secondVerify.ok, false);
  assert.equal((secondVerify as any).status, "REPLAY_REJECTED");
});
