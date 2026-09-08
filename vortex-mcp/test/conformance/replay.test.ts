// GOS3 · Vortex Foundation conformance artifact
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

test("REPLAY (concurrency): N concurrent calls sharing one request_id yield exactly 1 execution and N-1 REPLAY_REJECTED, with only ONE real filesystem effect", async () => {
  const { engine, connector, sandboxRoot } = makeEngineFixture();
  const targetPath = join(sandboxRoot, "concurrent-write.txt");

  // repository.write needs an onboarded GOS3 session + policy scope "allowed/*".
  const session = engine.onboard(["repo:allowed/repo"]).gos3_session_id;

  const CONCURRENCY = 100;
  const req = {
    request_id: "req-replay-concurrent-1",
    operation: "repository.write",
    kind: "execute" as const,
    ctx: ctxFor({
      capability: "repository.write",
      scope: { repository: "allowed/repo" },
      gos3_session_id: session,
    }),
    args: { path: targetPath, content: "single-writer-should-win" },
  };

  // Fire all N with the SAME request_id truly concurrently (no await between
  // dispatch calls) — this is exactly the race window the previous
  // check(assertFresh)-then-act(consume) implementation left open.
  const results = await Promise.all(
    Array.from({ length: CONCURRENCY }, () => engine.handle(req, connector.connectorId)),
  );

  const executedCount = results.filter((r) => r.execution_proof.executed === true).length;
  const replayRejectedCount = results.filter((r) => r.status === "REPLAY_REJECTED").length;

  assert.equal(executedCount, 1, `expected exactly 1 execution among ${CONCURRENCY} concurrent identical requests, got ${executedCount}`);
  assert.equal(
    replayRejectedCount,
    CONCURRENCY - 1,
    `expected ${CONCURRENCY - 1} REPLAY_REJECTED, got ${replayRejectedCount}`,
  );

  // Prove absence of a second effect, not just absence of a second "success"
  // status — the file must exist with content written exactly once.
  const { readFileSync } = await import("node:fs");
  const content = readFileSync(targetPath, "utf8");
  assert.equal(content, "single-writer-should-win");
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
