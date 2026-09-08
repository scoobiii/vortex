> **GOS3** · Vortex Foundation conformance artifact

# Identity — spec v1

## Principle

A human-readable signature such as:

```
P0 scoobiii : Agente GPT
```

is **not** cryptographic identity. It is metadata. Vortex requires the
two to be explicitly separated:

```json
{
  "agent_id": "agent/llm",
  "principal_id": "scoobiii",
  "key_id": "key-2026-01",
  "algorithm": "Ed25519",
  "public_key": "..."
}
```

## Signing

- Algorithm: **Ed25519** (mandatory for `Vortex Cryptographic Execution`
  conformance and above; see `conformance.md`).
- Signable bytes: JCS canonicalization (`RFC 8785`) of the
  `ExecutionProof` object **with the `signature` field removed** (see
  `execution-proof.md` and `key-discovery.md`).
- The signature MUST cover the entire proof. If any of the following
  is modified after signing, verification MUST fail:
  `output_hash`, `request_id`, `agent_id`, `executed`, `policy_id`,
  `sandbox_id`, or any other field present at signing time.

## Verification independence

A verifier reproduces canonicalization and hashing itself; it never
trusts a claim made by the executor about its own output. See
`verification.md`.

## Multi-agent runtimes

A runtime that serves more than one `agent_id` MUST resolve
`agent_id → keypair` at authorization time and reject with
`IDENTITY_INVALID` any request whose declared `agent_id` /
`principal_id` does not match the key that will ultimately sign the
resulting proof.
