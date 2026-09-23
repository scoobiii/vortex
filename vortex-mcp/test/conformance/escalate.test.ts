// GOS3 · Vortex Foundation conformance artifact
import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { makeEngineFixture, ctxFor } from "../helpers.js";

test("ESCALATE: repository.write outside allowed_scopes is POLICY_DENIED even with a fresh request_id", async () => {
  const { engine, connector, sandboxRoot } = makeEngineFixture();
  const path = join(sandboxRoot, "escalate.txt");

  const res = await engine.handle(
    {
      request_id: "req-escalate-1",
      operation: "repository.write",
      kind: "execute",
      ctx: ctxFor({ capability: "repository.write", scope: { repository: "forbidden/repo" } }),
      args: { path, content: "should not be written" },
    },
    connector.connectorId,
  );

  assert.equal(res.status, "POLICY_DENIED");
});

test("ESCALATE: repository.write in allowed scope but with no GOS3 onboarding is ONBOARD_REQUIRED, not executed", async () => {
  const { engine, connector, sandboxRoot } = makeEngineFixture();
  const path = join(sandboxRoot, "escalate2.txt");

  const res = await engine.handle(
    {
      request_id: "req-escalate-2",
      operation: "repository.write",
      kind: "execute",
      ctx: ctxFor({ capability: "repository.write", scope: { repository: "allowed/repo" } }),
      args: { path, content: "should not be written" },
    },
    connector.connectorId,
  );

  assert.equal(res.status, "ONBOARD_REQUIRED");
  assert.equal(res.execution_proof.executed, false);
});
