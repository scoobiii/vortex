# Key Discovery — spec v1

A verifier must be able to obtain the public key corresponding to an
`ExecutionProof.identity.key_id`. This specification defines four
valid mechanisms; an implementation MUST declare which one(s) it
supports.

## 1. Embedded

The public key travels with the proof or its transport envelope:

```json
{ "public_key": "..." }
```

Simplest, but does not allow key rotation without re-verifying old
proofs against a new embedded value out-of-band.

## 2. Registry

```
key_id → trusted registry → public key
```

The reference implementation in this repository uses this mechanism
(`src/key-registry.ts`): a JSON-backed map of `key_id` to
`{ public_key, agent_id, principal_id, algorithm }`.

## 3. Well-known

```
GET /.well-known/vortex-keys
```

Mirrors the `did:web` / JWKS pattern; suitable for a runtime that
exposes an HTTP endpoint alongside its MCP transport.

## 4. Policy-bound

```
policy → trusted issuer → key
```

The policy itself names a trusted issuer whose keys are authoritative
for proofs produced under that `policy_id`.

## Binding check

Regardless of mechanism, a verifier MUST also confirm that the
resolved registry entry's `agent_id` / `principal_id` matches the
values claimed inside the proof. A key that verifies the signature but
is registered to a *different* `agent_id`/`principal_id` than the
proof claims MUST be rejected as `IDENTITY_INVALID`, not treated as a
successful verification.
