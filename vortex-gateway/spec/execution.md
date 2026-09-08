# Execution

## Requirement

Once authenticated, validated, resolved, and credentialed, the Gateway
MUST execute the connector's `invoke()` under an enforced wall-clock
timeout (see `timeout.md`), and MUST observe the outcome regardless of
whether it succeeded, failed, or timed out.

## `executed` invariant

`ExecutionProof.executed` is `true` **if and only if**
`ExecutionProof.status === "OK"`. There is no partial-execution status:
a connector call either completes successfully (`OK`, `executed: true`)
or it does not (`executed: false`, whatever the specific status —
`ERROR`, `TIMEOUT`, or any earlier-pipeline rejection status). This
invariant is checked directly in the conformance suite
(`test/conformance/execution.test.ts`,
`test/conformance/proof.test.ts`) across every rejection path, not just
spot-checked for one case.

## Failure

A connector that throws (synchronously or via a rejected promise)
produces `status: "ERROR"`. A connector that does not resolve within its
timeout budget produces `status: "TIMEOUT"` (see `timeout.md`). In both
cases a full `ExecutionProof` is still produced — a failed execution is
itself an observable event, not a proof-less void.

## Reference implementation

`src/executor.ts` (`executeWithTimeout`), `src/gateway.ts`
(`Gateway.invoke`, execution + observation stages).

## Conformance tests

`test/conformance/execution.test.ts`, `test/conformance/timeout.test.ts`.
