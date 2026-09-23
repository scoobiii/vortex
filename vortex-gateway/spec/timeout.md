# Timeout

## Requirement

The Gateway MUST apply a bounded wall-clock timeout to every execution.
`InvokeRequest.timeout_ms`, if present, MUST be a positive finite
number; if absent or non-positive, the Gateway falls back to a
reference default (30000ms in this implementation —
`DEFAULT_EXECUTION_TIMEOUT_MS`).

## Cancellation

The Gateway constructs a real `AbortController` per invocation and
passes its `signal` into `ConnectorContext`. A well-behaved connector
SHOULD observe `signal` and cancel its own in-flight work (abort a
fetch, close a handle, stop a subprocess) when it fires. The Gateway
does **not** wait for the connector's promise to settle after a timeout
fires — it reports `TIMEOUT` to the caller immediately and abandons the
in-flight promise. A connector that ignores the signal will keep running
in the background even though the Gateway has already moved on; this is
a known limitation of cooperative cancellation in JavaScript (there is
no way to force-preempt an already-running synchronous or
signal-ignoring async operation) and is documented here rather than
silently assumed away.

## Failure

Exceeding the timeout produces `status: "TIMEOUT"`, `executed: false`. A
full `ExecutionProof` is still produced (see `execution-proof.md`).

## Reference implementation

`src/executor.ts` (`executeWithTimeout`, `ExecutionTimeoutError`,
`DEFAULT_EXECUTION_TIMEOUT_MS`).

## Conformance tests

`test/conformance/timeout.test.ts`.
