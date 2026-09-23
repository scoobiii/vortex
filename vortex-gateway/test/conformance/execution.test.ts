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

test("EXECUTE: a connector that throws maps to status ERROR, executed=TRUE — the invocation genuinely occurred", async () => {
  const { gateway } = buildTestGateway();
  await assert.rejects(
    () => gateway.invoke({ request_id: "r1", connector_id: "boom", operation: "explode", input: {} }, "good-token"),
    (err: unknown) => {
      assert.ok(err instanceof GatewayError);
      assert.equal(err.status, "ERROR");
      // executed=true: connector.invoke() ran and threw. Reporting false here
      // would misrepresent "attempted and failed" as "never attempted".
      assert.equal(err.proof.executed, true);
      assert.equal(err.proof.output_hash, null); // no successful output exists
      assert.match(err.message, /simulated connector failure/);
      return true;
    }
  );
});

test("EXECUTE: executed reflects whether connector.invoke() ran, NOT whether status is OK", async () => {
  const { gateway } = buildTestGateway();
  // Pre-execution rejections (auth/validation/resolution/credential) never
  // call connector.invoke() — executed MUST be false here.
  const preExecutionCases: Array<[unknown, string | undefined]> = [
    [{ request_id: "r1", connector_id: "echo", operation: "ping", input: {} }, undefined], // UNAUTHENTICATED
    [{ request_id: "", connector_id: "echo", operation: "ping", input: {} }, "good-token"], // INVALID_REQUEST
    [{ request_id: "r1", connector_id: "ghost", operation: "ping", input: {} }, "good-token"], // UNKNOWN_CONNECTOR
  ];
  for (const [req, token] of preExecutionCases) {
    await assert.rejects(
      () => gateway.invoke(req, token),
      (err: unknown) => {
        assert.ok(err instanceof GatewayError);
        assert.notEqual(err.proof.status, "OK");
        assert.equal(err.proof.executed, false, `expected executed=false for pre-execution rejection (status=${(err as GatewayError).status})`);
        return true;
      }
    );
  }

  // Post-execution-start rejections (ERROR/TIMEOUT) DID call connector.invoke()
  // — executed MUST be true even though status !== OK.
  await assert.rejects(
    () => gateway.invoke({ request_id: "r1", connector_id: "boom", operation: "explode", input: {} }, "good-token"),
    (err: unknown) => {
      assert.ok(err instanceof GatewayError);
      assert.equal(err.status, "ERROR");
      assert.equal(err.proof.executed, true, "ERROR after invoke() started must report executed=true");
      return true;
    }
  );
});
