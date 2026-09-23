# Error Model

## Status values

`ExecutionStatus` is a closed enum — the Gateway never returns a free-text
or "probably" status:

| Status              | Meaning                                              | `executed` |
|----------------------|-------------------------------------------------------|------------|
| `OK`                 | Connector call completed successfully                 | `true`     |
| `ERROR`              | Connector call threw / rejected                       | `false`    |
| `TIMEOUT`            | Connector call exceeded its timeout budget             | `false`    |
| `UNAUTHENTICATED`    | Caller authentication failed                           | `false`    |
| `INVALID_REQUEST`    | Request failed structural validation                   | `false`    |
| `UNKNOWN_CONNECTOR`  | `connector_id` is not registered                        | `false`    |
| `UNKNOWN_OPERATION`  | Connector is registered but doesn't support `operation` | `false`    |
| `CREDENTIAL_DENIED`  | `credential_id` unknown, or known but out of scope      | `false`    |

## `GatewayError`

Every rejection is a thrown `GatewayError`:

```ts
class GatewayError extends Error {
  readonly status: ExecutionStatus;
  readonly proof: ExecutionProof;   // always present, executed: false
}
```

Callers MUST be able to obtain a proof from a rejection just as easily
as from a success — `err.proof` is not optional, and it is not a
"best-effort partial proof": it carries the same shape and the same
hash guarantees as a success proof, with `output_hash: null` and
`executed: false`.

## Best-effort field extraction

Some rejections (`UNAUTHENTICATED`, and `INVALID_REQUEST` for a
non-object payload) happen before the request can be fully parsed as an
`InvokeRequest`. In those cases the proof's `request_id` / `connector_id`
/ `operation` are extracted best-effort from the raw payload (a
plausible string value if present, else the literal string `"unknown"`)
and `input` defaults to `null` if it cannot be read. This keeps the
proof's shape uniform across every rejection path rather than making
those three fields optional only in the earliest-pipeline failures.

## Reference implementation

`src/types.ts` (`ExecutionStatus`, `GatewayError`), `src/errors.ts`
(`bestEffortField`, `bestEffortInput`), `src/gateway.ts` (`#reject`).

## Conformance tests

Exercised across every `test/conformance/*.test.ts` file — each pipeline
stage's dedicated test file asserts its own status/executed pairing;
`test/conformance/execution.test.ts` additionally asserts the
`executed === (status === "OK")` invariant across every rejection path
in a single loop.
