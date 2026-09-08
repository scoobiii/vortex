# Anti-Replay — spec v1

## Principle

> proof válido ≠ proof executável novamente

A valid, well-signed `ExecutionProof` is evidence that an operation
happened once. It is never, by itself, authorization to run that
operation again.

## Request-level replay

An implementation MUST reject a request whose `request_id` has already
been consumed within the relevant policy/session context, with status
`REPLAY_REJECTED`. This check happens **before** authorization,
sandboxing, or execution — a replayed request is rejected regardless
of whether it would otherwise have been authorized.

`request_id` MUST be consumed (marked as seen) only once a definitive
outcome is reached — success or a terminal denial — so that a request
that failed before reaching a determination (e.g. a transport error)
may be legitimately retried with the same `request_id`.

## Session-level replay

A `gos3_session_id` that has expired, or is presented outside the
resource context it was onboarded for, MUST be rejected with
`ONBOARD_REQUIRED` (see `gos3.md`) — an expired session is not
"replay" in the request sense, but the same principle applies:
possession of a past authorization artifact does not extend its
validity.

## Verifier-side replay bookkeeping

An independent verifier that observes proofs from an untrusted
transport (e.g. proofs submitted by a third party as "evidence of
work performed") SHOULD additionally track which `request_id`s it has
already verified, and reject a second verification attempt of the same
`request_id` with `REPLAY_REJECTED` — the reference implementation
supports this via an optional `seenRequestIds` set passed to
`verifyExecutionProof`.
