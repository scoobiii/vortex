> **GOS3** · Vortex Foundation conformance artifact

# Invocation

## InvokeRequest

```ts
interface InvokeRequest {
  request_id: string;       // MUST, matches ^[A-Za-z0-9._-]{1,128}$
  connector_id: string;     // MUST, matches ^[A-Za-z0-9._-]{1,128}$
  operation: string;        // MUST, non-empty
  input: unknown;           // MUST be present (use null explicitly if none)
  credential_id?: string;   // OPTIONAL
  timeout_ms?: number;      // OPTIONAL, positive finite; default is
                            // implementation-defined (reference: 30000)
  metadata?: Record<string, unknown>; // OPTIONAL, JSON object
}
```

## InvokeResult

```ts
interface InvokeResult {
  ok: boolean;
  output: unknown | null;
  proof: ExecutionProof;    // see execution-proof.md
}
```

## Rejection

A request that does not complete successfully at any pipeline stage is
rejected with a `GatewayError` carrying:

- `status`: one of the `ExecutionStatus` values (see `error-model.md`)
- `message`: human-readable explanation
- `proof`: an `ExecutionProof` with `executed: false` (see
  `execution-proof.md`) — **a proof is never withheld on rejection.**

## Reference implementation

`src/types.ts` (`InvokeRequest`, `InvokeResult`, `GatewayError`),
`src/gateway.ts` (`Gateway.invoke`).

## Conformance tests

`test/conformance/validate.test.ts`, `test/conformance/e2e.test.ts`.
