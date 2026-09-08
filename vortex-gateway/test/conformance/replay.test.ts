// GOS3 · Vortex Foundation conformance artifact
import { test } from "node:test";
import assert from "node:assert/strict";
import type { ConnectorContext, VortexConnector } from "../../src/types.js";
import { GatewayError } from "../../src/types.js";
import { Gateway } from "../../src/gateway.js";
import { StaticTokenAuthenticator } from "../../src/auth.js";
import { ConnectorRegistry } from "../../src/connector-registry.js";
import { CredentialBroker } from "../../src/credential-broker.js";

class CountingConnector implements VortexConnector {
  readonly id = "counting";
  readonly operations = ["write"] as const;
  calls = 0;
  writes = 0;

  async invoke(input: unknown, _ctx: ConnectorContext): Promise<unknown> {
    this.calls += 1;
    await new Promise<void>((resolve) => setTimeout(resolve, 20));
    this.writes += 1;
    return { written: input, write_count: this.writes };
  }
}

function buildReplayGateway() {
  const connector = new CountingConnector();
  const connectors = new ConnectorRegistry().register(connector);
  const credentials = new CredentialBroker();
  const authenticator = new StaticTokenAuthenticator({ "good-token": "test-caller" });
  const gateway = new Gateway({
    authenticator,
    connectors,
    credentials,
    runtime_id: "replay-test-runtime",
  });
  return { gateway, connector };
}

test("REPLAY: sequential reuse of request_id is rejected without a second connector execution", async () => {
  const { gateway, connector } = buildReplayGateway();
  const request = {
    request_id: "replay-sequential-001",
    connector_id: "counting",
    operation: "write",
    input: { value: "one" },
  };

  const first = await gateway.invoke(request, "good-token");
  assert.equal(first.proof.status, "OK");
  assert.equal(first.proof.executed, true);
  assert.equal(connector.calls, 1);
  assert.equal(connector.writes, 1);

  await assert.rejects(
    () => gateway.invoke(request, "good-token"),
    (err: unknown) => {
      assert.ok(err instanceof GatewayError);
      assert.equal(err.status, "REPLAY_DENIED");
      assert.equal(err.proof.status, "REPLAY_DENIED");
      assert.equal(err.proof.executed, false);
      return true;
    },
  );

  assert.equal(connector.calls, 1);
  assert.equal(connector.writes, 1);
});

test("REPLAY: concurrent duplicate requests cannot both execute the connector", async () => {
  const { gateway, connector } = buildReplayGateway();
  const request = {
    request_id: "replay-concurrent-001",
    connector_id: "counting",
    operation: "write",
    input: { value: "one" },
  };

  const outcomes = await Promise.allSettled([
    gateway.invoke(request, "good-token"),
    gateway.invoke(request, "good-token"),
  ]);

  const successes = outcomes.filter(
    (outcome): outcome is PromiseFulfilledResult<Awaited<ReturnType<Gateway["invoke"]>>> => outcome.status === "fulfilled",
  );
  const failures = outcomes.filter((outcome) => outcome.status === "rejected");

  assert.equal(successes.length, 1);
  assert.equal(failures.length, 1);
  const replay = failures[0];
  assert.ok(replay.reason instanceof GatewayError);
  assert.equal(replay.reason.status, "REPLAY_DENIED");
  assert.equal(replay.reason.proof.executed, false);

  assert.equal(connector.calls, 1, "exactly one connector invocation may start");
  assert.equal(connector.writes, 1, "exactly one external side effect may occur");
});
