> **GOS3** · Vortex Foundation conformance artifact

# Authentication

## Requirement

The Gateway MUST authenticate its caller before doing anything else with
the request — authentication happens even before the request is known to
be well-formed (see `vortex-gateway.md` §2, step order). This is a
deliberate choice: an unauthenticated caller does not get to learn
*anything* about why their request failed structurally.

This authenticates the **caller of the Gateway** (e.g. Vortex MCP, or a
CI job acting on its behalf) — it is not the same thing as the agent
identity Vortex MCP's `identity.md` establishes for an LLM. The Gateway
has no opinion on LLM identity; that is layered on top by whoever calls
it.

## Mechanism

Not mandated. The specification defines an `Authenticator` interface:

```ts
interface AuthContext {
  authenticated: boolean;
  caller_id?: string;
}
interface Authenticator {
  authenticate(token: string | undefined): AuthContext;
}
```

Implementations may back this with mTLS, OIDC, HMAC-signed requests, or
(as in the reference implementation) a static bearer-token allowlist.
**The reference `StaticTokenAuthenticator` is explicitly a reference, not
a production recommendation** — production deployments should supply
their own `Authenticator`.

## Failure

Authentication failure produces `status: "UNAUTHENTICATED"`,
`executed: false`. Because authentication runs before validation, the
proof for this rejection uses best-effort extraction of
`request_id`/`connector_id`/`operation` from the raw payload (falling
back to the literal string `"unknown"` for any field that cannot be
read) — see `error-model.md`.

## Reference implementation

`src/auth.ts` (`StaticTokenAuthenticator`, `DenyAllAuthenticator`).

## Conformance tests

`test/conformance/auth.test.ts`.
