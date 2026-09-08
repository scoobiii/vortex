// GOS3 · Vortex Foundation conformance artifact
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ConnectorRegistry,
  UnknownConnectorError,
  UnknownOperationError,
} from "../../src/connector-registry.js";
import { GatewayError } from "../../src/types.js";
import { EchoConnector, buildTestGateway } from "../helpers.js";

test("RESOLVE: registry resolves a known connector + operation", () => {
  const registry = new ConnectorRegistry().register(new EchoConnector());
  const connector = registry.resolve("echo", "ping");
  assert.equal(connector.id, "echo");
  assert.equal(registry.has("echo"), true);
  assert.equal(registry.has("nope"), false);
});

test("RESOLVE: registry throws UnknownConnectorError for an unregistered connector", () => {
  const registry = new ConnectorRegistry();
  assert.throws(() => registry.resolve("ghost", "ping"), UnknownConnectorError);
});

test("RESOLVE: registry throws UnknownOperationError for an unsupported operation", () => {
  const registry = new ConnectorRegistry().register(new EchoConnector());
  assert.throws(() => registry.resolve("echo", "delete-everything"), UnknownOperationError);
});

test("RESOLVE: Gateway maps an unknown connector to UNKNOWN_CONNECTOR, not executed", async () => {
  const { gateway } = buildTestGateway();
  await assert.rejects(
    () =>
      gateway.invoke(
        { request_id: "r1", connector_id: "ghost", operation: "ping", input: {} },
        "good-token"
      ),
    (err: unknown) => {
      assert.ok(err instanceof GatewayError);
      assert.equal(err.status, "UNKNOWN_CONNECTOR");
      assert.equal(err.proof.executed, false);
      return true;
    }
  );
});

test("RESOLVE: Gateway maps an unsupported operation to UNKNOWN_OPERATION, not executed", async () => {
  const { gateway } = buildTestGateway();
  await assert.rejects(
    () =>
      gateway.invoke(
        { request_id: "r1", connector_id: "echo", operation: "delete-everything", input: {} },
        "good-token"
      ),
    (err: unknown) => {
      assert.ok(err instanceof GatewayError);
      assert.equal(err.status, "UNKNOWN_OPERATION");
      assert.equal(err.proof.executed, false);
      return true;
    }
  );
});
