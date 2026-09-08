# Execution Proof — spec v1

The `ExecutionProof` is the accountability artifact of Vortex MCP. It
is produced for **every** operation (`inspect`, `propose`, `verify`,
`execute`, `branch.write`), regardless of outcome.

## Minimal schema (proof_version "1")

```json
{
  "proof_version": "1",

  "request_id": "...",
  "execution_id": "...",
  "runtime_id": "...",

  "agent_id": "...",
  "principal_id": "...",

  "connector_id": "...",
  "operation": "...",

  "executed": true,
  "status": "success",

  "input_hash": "sha256:...",
  "output_hash": "sha256:...",

  "started_at": "...",
  "completed_at": "...",
  "duration_ms": 1234,

  "policy_id": "...",
  "policy_version": "...",

  "gos3_session_id": "...",
  "sandbox_id": "...",

  "identity": { "key_id": "...", "algorithm": "Ed25519" },
  "signature": "..."
}
```

All fields except `signature` are covered by the signature (see
`identity.md`). `input_hash` / `output_hash` are computed as
`sha256:<hex>` over the JCS canonicalization of the request arguments
and the operation's output respectively (`key-discovery.md` and
`canonicalize.ts` in the reference implementation).

## Failure semantics

`executed = false` MUST be produced whenever the operation did not run
to completion — including `POLICY_DENIED`, `SANDBOX_DENIED`,
`ONBOARD_REQUIRED`, `REPLAY_REJECTED`, `EXECUTION_TIMEOUT`. A proof
with `executed = false` is still signed and still verifiable: denial
is itself an accountable event.

`executed = false` MUST NOT be interpreted as "probably executed" —
implementations MUST NOT collapse distinct denial reasons into a
generic failure; the `status` field carries the specific reason (see
`vortex-mcp.md` §5 and the state list in `anti-replay.md` /
`authorization.md`).

## Derivation, not invention

This schema is intentionally close to what an existing Gateway
implementation already emits internally — the specification is
derived **spec-from-code**, not invented in parallel with a running
system. New fields may be added in `proof_version "2"`, but the
"never reproduce this exact byte sequence without invalidating the
signature" property must hold across versions.
