// GOS3 · Vortex Foundation conformance artifact
import { test } from "node:test";
import assert from "node:assert/strict";
import { executeWithTimeout, ExecutionTimeoutError, DEFAULT_EXECUTION_TIMEOUT_MS } from "../../src/executor.js";
import { GatewayError } from "../../src/types.js";
import { EchoConnector, buildTestGateway } from "../helpers.js";

test("TIMEOUT: a connector that finishes well within the budget succeeds", async () => {
  const { output } = await executeWithTimeout({
    connector: new EchoConnector(5),
    operation: "ping",
    input: { a: 1 },
    request_id: "r1",
    timeout_ms: 5_000,
  });
  assert.deepEqual(output, { echoed: { a: 1 } });
});

test("TIMEOUT: timeout_ms <= 0 falls back to the default budget", async () => {
  const { output } = await executeWithTimeout({
    connector: new EchoConnector(0),
    operation: "ping",
    input: {},
    request_id: "r1",
    timeout_ms: 0,
  });
  assert.deepEqual(output, { echoed: {} });
});

test("TIMEOUT: a connector that exceeds the budget is aborted and rejects with ExecutionTimeoutError", async () => {
  await assert.rejects(
    () =>
      executeWithTimeout({
        connector: new EchoConnector(200),
        operation: "ping",
        input: {},
        request_id: "r1",
        timeout_ms: 20,
      }),
    ExecutionTimeoutError
  );
});

test("TIMEOUT: DEFAULT_EXECUTION_TIMEOUT_MS is a sane positive number", () => {
  assert.ok(DEFAULT_EXECUTION_TIMEOUT_MS > 0);
});

test("TIMEOUT: Gateway reports status TIMEOUT and executed=TRUE when a connector overruns — the invocation started", async () => {
  const { gateway } = buildTestGateway({ delayMs: 200 });
  await assert.rejects(
    () =>
      gateway.invoke(
        { request_id: "r1", connector_id: "echo", operation: "ping", input: {}, timeout_ms: 20 },
        "good-token"
      ),
    (err: unknown) => {
      assert.ok(err instanceof GatewayError);
      assert.equal(err.status, "TIMEOUT");
      // connector.invoke() was called and was still running when the deadline
      // hit — the attempt genuinely happened. executed=false would hide that
      // a possibly-partial side effect may exist from the abandoned call.
      assert.equal(err.proof.executed, true, "a connector that started running before timing out DID execute");
      assert.equal(err.proof.status, "TIMEOUT");
      assert.equal(err.proof.output_hash, null, "no successful output exists even though executed=true");
      return true;
    }
  );
});

test("TIMEOUT: Gateway succeeds when the connector finishes inside a generous timeout", async () => {
  const { gateway } = buildTestGateway({ delayMs: 5 });
  const result = await gateway.invoke(
    { request_id: "r1", connector_id: "echo", operation: "ping", input: {}, timeout_ms: 2_000 },
    "good-token"
  );
  assert.equal(result.ok, true);
  assert.equal(result.proof.status, "OK");
});
