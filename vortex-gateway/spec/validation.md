> **GOS3** · Vortex Foundation conformance artifact

# Validation

## Requirement

After authentication, the Gateway MUST structurally validate the request
before resolving a connector, a credential, or executing anything. This
is deliberately independent of connector/credential existence — it only
asks "is this well-formed at all?"

## Rules

- `request_id`, `connector_id`: non-empty strings matching
  `^[A-Za-z0-9._-]{1,128}$`.
- `operation`: non-empty string.
- `input`: MUST be present as a key (an explicit `null` is valid and
  distinct from a missing `input`).
- `credential_id`, if present: string.
- `timeout_ms`, if present: positive finite number.
- `metadata`, if present: a JSON object (not an array, not null).

All violations are collected and reported together (not fail-fast on the
first one) so a caller can fix every problem in one round-trip.

## Failure

Validation failure produces `status: "INVALID_REQUEST"`,
`executed: false`, with the joined list of violations in the error
message.

## Reference implementation

`src/validate.ts` (`validateInvokeRequest`, `isInvokeRequest`).

## Conformance tests

`test/conformance/validate.test.ts`.
