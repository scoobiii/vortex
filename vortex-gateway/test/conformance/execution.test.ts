import { test } from "node:test";
import assert from "node:assert/strict";
import { GatewayError } from "../../src/types.js";
import { buildTestGateway } from "../helpers.js";

test("EXECUTE: a successful connector call returns executed=true, status=OK", async () => {
  const { gateway } = buildTestGateway();
  const result = await gateway.invoke(
    { request_id: "r1", connector_id: "echo", operation: "ping", input: { n: 1 } },
    "good-token"
  );
  assert.equal(result.ok, true);
  assert.equal(result.proof.executed, true);
  assert.equal(result.proof.status, "OK");
  assert.deepEqual(result.output, { echoed: { n: 1 } });
});

test("EXECUTE: a connector that throws maps to status ERROR, executed=false — but a proof is still produced", async () => {
  const { gateway } = buildTestGateway();
  await assert.rejects(
    () => gateway.invoke({ request_id: "r1", connector_id: "boom", operation: "explode", input: {} }, "good-token"),
    (err: unknown) => {
      assert.ok(err instanceof GatewayError);
      assert.equal(err.status, "ERROR");
      assert.equal(err.proof.executed, false);
      assert.match(err.message, /simulated connector failure/);
      return true;
    }
  );
});

test("EXECUTE: executed is true if and only if status is OK, across every rejection path", async () => {
  const { gateway } = buildTestGateway();
  const cases: Array<[unknown, string | undefined]> = [
    [{ request_id: "r1", connector_id: "echo", operation: "ping", input: {} }, undefined], // UNAUTHENTICATED
    [{ request_id: "", connector_id: "echo", operation: "ping", input: {} }, "good-token"], // INVALID_REQUEST
    [{ request_id: "r1", connector_id: "ghost", operation: "ping", input: {} }, "good-token"], // UNKNOWN_CONNECTOR
    [{ request_id: "r1", connector_id: "boom", operation: "explode", input: {} }, "good-token"], // ERROR
  ];
  for (const [req, token] of cases) {
    await assert.rejects(
      () => gateway.invoke(req, token),
      (err: unknown) => {
        assert.ok(err instanceof GatewayError);
        assert.notEqual(err.proof.status, "OK");
        assert.equal(err.proof.executed, false);
        return true;
      }
    );
  }
});
