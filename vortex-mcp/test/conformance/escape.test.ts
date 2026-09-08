// GOS3 · Vortex Foundation conformance artifact
import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { makeEngineFixture, ctxFor } from "../helpers.js";

test("ESCAPE: write outside sandbox filesystem_scope is SANDBOX_DENIED, even when authorized+onboarded", async () => {
  const { engine, connector, gos3 } = makeEngineFixture();

  const session = gos3.onboard("test-principal", "agent/test", ["repo:allowed/repo"]);
  const outsidePath = join("/tmp", "outside-sandbox-escape.txt");

  const res = await engine.handle(
    {
      request_id: "req-escape-1",
      operation: "repository.write",
      kind: "execute",
      ctx: ctxFor({
        capability: "repository.write",
        scope: { repository: "allowed/repo" },
        gos3_session_id: session.gos3_session_id,
      }),
      args: { path: outsidePath, content: "should not escape" },
    },
    connector.connectorId,
  );

  assert.equal(res.status, "SANDBOX_DENIED");
  assert.equal(res.execution_proof.executed, false);
});
