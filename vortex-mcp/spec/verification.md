# Verification — spec v1

## Principle

The verifier MUST NOT trust the executor. It re-derives everything it
can from the proof itself and from independently-sourced material
(the key registry, the policy document).

```
Executor → Execution Proof ──┬──> Executor's own record
                              └──> Independent Verifier
```

## Verification steps (in order)

1. **Schema** — all required fields of `ExecutionProof` are present
   and `proof_version` is supported.
2. **Key discovery** — resolve `identity.key_id` to a public key
   (`key-discovery.md`).
3. **Identity binding** — the resolved registry entry's `agent_id` /
   `principal_id` match the proof's claimed values; mismatch →
   `IDENTITY_INVALID`.
4. **Canonicalization + signature** — recompute JCS over the proof
   minus `signature`, and verify the Ed25519 signature against the
   resolved public key; failure → `VERIFICATION_FAILED`.
5. **Replay** (optional, transport-dependent) — reject a `request_id`
   already verified once in this verifier's bookkeeping window →
   `REPLAY_REJECTED` (`anti-replay.md`).

A result of `{ ok: true }` means: *this proof was produced by the
holder of the named key, is internally self-consistent, and has not
been tampered with since signing.* It does **not** by itself mean the
operation's real-world side effects still match `output_hash` at the
time of verification — see the note on tamper detection below.

## Tamper detection of artifacts vs. proofs

`output_hash` is a commitment to the state of the operation's output
**at the moment it was produced**. If an artifact referenced by a
proof is modified afterward (e.g. a file rewritten directly, bypassing
the connector), the *proof itself* remains validly signed — signatures
don't change retroactively — but re-hashing the *current* artifact and
comparing it to the proof's `output_hash` will reveal a mismatch. This
is the intended detection mechanism for post-hoc tampering: verifiers
that care about artifact integrity over time must re-hash and compare,
not merely check the signature.

## Independence requirement

The verifier implementation MUST be able to run without access to the
executor's runtime state (no calling back into the connector, no
querying the engine's in-memory replay store). The reference
`verifier.ts` / `verifier-cli.ts` demonstrate this: they take only a
serialized proof and a key registry as input.
