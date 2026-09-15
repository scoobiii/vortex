// GOS3 · Vortex Foundation conformance artifact
import { test } from "node:test";
import assert from "node:assert/strict";
import { StaticTokenAuthenticator, DenyAllAuthenticator } from "../../src/auth.js";
import { GatewayError } from "../../src/types.js";
import { buildTestGateway } from "../helpers.js";

test("AUTH: StaticTokenAuthenticator accepts a known token", () => {
  const auth = new StaticTokenAuthenticator({ tok: "caller-a" });
  const ctx = auth.authenticate("tok");
  assert.equal(ctx.authenticated, true);
  assert.equal(ctx.caller_id, "caller-a");
});

test("AUTH: StaticTokenAuthenticator rejects an unknown token", () => {
  const auth = new StaticTokenAuthenticator({ tok: "caller-a" });
  assert.equal(auth.authenticate("wrong").authenticated, false);
});

test("AUTH: StaticTokenAuthenticator rejects a missing token", () => {
  const auth = new StaticTokenAuthenticator({ tok: "caller-a" });
  assert.equal(auth.authenticate(undefined).authenticated, false);
});

test("AUTH: DenyAllAuthenticator always rejects", () => {
  const auth = new DenyAllAuthenticator();
  assert.equal(auth.authenticate("anything").authenticated, false);
  assert.equal(auth.authenticate(undefined).authenticated, false);
});

test("AUTH: Gateway rejects an unauthenticated call before touching validation/execution", async () => {
  const { gateway } = buildTestGateway();
  await assert.rejects(
    () => gateway.invoke({ request_id: "r1", connector_id: "echo", operation: "ping", input: {} }, undefined),
    (err: unknown) => {
      assert.ok(err instanceof GatewayError);
      assert.equal(err.status, "UNAUTHENTICATED");
      assert.equal(err.proof.executed, false);
      assert.equal(err.proof.status, "UNAUTHENTICATED");
      return true;
    }
  );
});

test("AUTH: rejection proof still carries best-effort identifiers even for a malformed request", async () => {
  const { gateway } = buildTestGateway();
  await assert.rejects(
    () => gateway.invoke("not-an-object", "bad-token"),
    (err: unknown) => {
      assert.ok(err instanceof GatewayError);
      assert.equal(err.status, "UNAUTHENTICATED");
      assert.equal(err.proof.request_id, "unknown");
      assert.equal(err.proof.connector_id, "unknown");
      assert.equal(err.proof.operation, "unknown");
      return true;
    }
  );
});

test("AUTH: an authenticated call proceeds past the authentication stage", async () => {
  const { gateway } = buildTestGateway();
  const result = await gateway.invoke(
    { request_id: "r2", connector_id: "echo", operation: "ping", input: { a: 1 } },
    "good-token"
  );
  assert.equal(result.ok, true);
  assert.equal(result.proof.status, "OK");
});
