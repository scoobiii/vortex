# Credentials

## Fundamental rule

> The credential belongs to the execution boundary, not the agent.

The caller (and, transitively, the LLM) supplies only a `credential_id`.
The Gateway resolves the underlying secret internally and injects it
into the connector's execution context (`ConnectorContext.credential`).
**The raw secret MUST NEVER appear** in `InvokeResult.output` added by
the Gateway itself, nor anywhere in `ExecutionProof` — the proof only
ever carries `credential_id`.

This does not (and cannot) stop a *misbehaving connector* from choosing
to echo the secret back in its own output — that is a connector-trust
problem, not something the Gateway boundary can prevent by construction.
What the Gateway guarantees is that it never independently re-adds or
logs the secret anywhere in its own proof/response construction. See
`test/conformance/credential.test.ts` ("CREDENTIAL: the broker injects
the secret ... but the Gateway adds nothing extra") for the adversarial
connector used to probe exactly this boundary.

## Scope enforcement

Every credential is registered with an explicit scope:

```ts
interface CredentialGrant {
  id: string;
  secret?: unknown;
  scope: Array<{ connector_id: string; operations: readonly string[] }>;
}
```

Resolution MUST check that `(connector_id, operation)` is covered by the
grant's scope. A credential valid for `filesystem.read` is not valid for
`filesystem.write`, and a credential valid for `filesystem.*` is not
valid for `github.*`, unless explicitly scoped to both.

This was identified as an unexercised gap in the parent Vortex MCP audit
("`credential_scope` implementado no código mas nunca exercitado") — in
the Gateway, `assertInScope()` is load-bearing on every request that
carries a `credential_id`, and the conformance suite has dedicated
adversarial tests for both the unknown-credential and the
out-of-scope-credential cases.

## Failure

Unknown `credential_id`, or a credential outside its granted scope, both
produce `status: "CREDENTIAL_DENIED"`, `executed: false`.

## Reference implementation

`src/credential-broker.ts` (`CredentialBroker`, `UnknownCredentialError`,
`CredentialOutOfScopeError`).

## Conformance tests

`test/conformance/credential.test.ts`.
