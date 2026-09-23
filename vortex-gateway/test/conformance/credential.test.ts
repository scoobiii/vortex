import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CredentialBroker,
  UnknownCredentialError,
  CredentialOutOfScopeError,
} from "../../src/credential-broker.js";
import { GatewayError } from "../../src/types.js";
import { buildTestGateway } from "../helpers.js";

test("CREDENTIAL: broker resolves a credential that is in scope", () => {
  const broker = new CredentialBroker().register({
    id: "c1",
    secret: "x",
    scope: [{ connector_id: "echo", operations: ["ping"] }],
  });
  const grant = broker.resolve("c1", "echo", "ping");
  assert.equal(grant.id, "c1");
  assert.equal(broker.has("c1"), true);
});

test("CREDENTIAL: broker throws UnknownCredentialError for an unregistered credential", () => {
  const broker = new CredentialBroker();
  assert.throws(() => broker.resolve("ghost", "echo", "ping"), UnknownCredentialError);
  assert.equal(broker.has("ghost"), false);
});

test("CREDENTIAL: broker throws CredentialOutOfScopeError for wrong connector", () => {
  const broker = new CredentialBroker().register({
    id: "c1",
    scope: [{ connector_id: "echo", operations: ["ping"] }],
  });
  assert.throws(() => broker.resolve("c1", "other-connector", "ping"), CredentialOutOfScopeError);
});

test("CREDENTIAL: broker throws CredentialOutOfScopeError for wrong operation on the right connector", () => {
  const broker = new CredentialBroker().register({
    id: "c1",
    scope: [{ connector_id: "echo", operations: ["ping"] }],
  });
  assert.throws(() => broker.resolve("c1", "echo", "delete-everything"), CredentialOutOfScopeError);
});

test("CREDENTIAL: assertInScope can be called directly without throwing when in scope", () => {
  const broker = new CredentialBroker();
  const grant = { id: "c2", scope: [{ connector_id: "echo", operations: ["ping"] }] };
  assert.doesNotThrow(() => broker.assertInScope(grant, "echo", "ping"));
});

test("CREDENTIAL: Gateway denies an unknown credential_id — CREDENTIAL_DENIED, not executed", async () => {
  const { gateway } = buildTestGateway();
  await assert.rejects(
    () =>
      gateway.invoke(
        {
          request_id: "r1",
          connector_id: "echo",
          operation: "ping",
          input: {},
          credential_id: "ghost-credential",
        },
        "good-token"
      ),
    (err: unknown) => {
      assert.ok(err instanceof GatewayError);
      assert.equal(err.status, "CREDENTIAL_DENIED");
      assert.equal(err.proof.executed, false);
      assert.equal(err.proof.credential_id, "ghost-credential");
      return true;
    }
  );
});

test("CREDENTIAL: Gateway denies a credential that exists but is out of scope for this connector/operation", async () => {
  // buildTestGateway's "cred-echo-ping" grant only covers echo.ping/reveal-credential;
  // asking it to authorize a different (registered) connector must fail closed.
  const { gateway } = buildTestGateway();
  // boom connector is already registered by buildTestGateway; reuse it as the
  // "wrong" target for a credential scoped only to echo.
  await assert.rejects(
    () =>
      gateway.invoke(
        {
          request_id: "r1",
          connector_id: "boom",
          operation: "explode",
          input: {},
          credential_id: "cred-echo-ping",
        },
        "good-token"
      ),
    (err: unknown) => {
      assert.ok(err instanceof GatewayError);
      assert.equal(err.status, "CREDENTIAL_DENIED");
      assert.equal(err.proof.executed, false);
      return true;
    }
  );
});

test("CREDENTIAL: Gateway accepts a credential that is properly in scope, and the raw secret never reaches the caller", async () => {
  const { gateway } = buildTestGateway();
  const result = await gateway.invoke(
    {
      request_id: "r1",
      connector_id: "echo",
      operation: "ping",
      input: { hello: "world" },
      credential_id: "cred-echo-ping",
    },
    "good-token"
  );
  assert.equal(result.ok, true);
  assert.equal(result.proof.credential_id, "cred-echo-ping");
  // The proof MUST NOT contain the raw secret anywhere in its serialized form.
  const serialized = JSON.stringify(result.proof);
  assert.doesNotMatch(serialized, /s3cr3t-value/);
  // The response for a non-leaking operation must not contain it either.
  assert.doesNotMatch(JSON.stringify(result.output), /s3cr3t-value/);
});

test("CREDENTIAL: the broker injects the secret into the connector context (so connectors CAN use it) but the Gateway adds nothing extra", async () => {
  const { gateway } = buildTestGateway();
  const result = await gateway.invoke(
    {
      request_id: "r1",
      connector_id: "echo",
      operation: "reveal-credential",
      input: {},
      credential_id: "cred-echo-ping",
    },
    "good-token"
  );
  // The connector itself chose to echo the credential back — proving the
  // broker really injected it — but this is the connector's own output,
  // never something the Gateway pipeline appended independently.
  assert.deepEqual(result.output, { credential: "s3cr3t-value" });
  // The proof still only ever carries credential_id, never the secret value.
  assert.equal(result.proof.credential_id, "cred-echo-ping");
});

test("CREDENTIAL: a request with no credential_id at all runs fine when the connector doesn't require one", async () => {
  const { gateway } = buildTestGateway();
  const result = await gateway.invoke(
    { request_id: "r1", connector_id: "echo", operation: "ping", input: {} },
    "good-token"
  );
  assert.equal(result.ok, true);
  assert.equal(result.proof.credential_id, null);
});
