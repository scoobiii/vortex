> **GOS3** · Vortex Foundation conformance artifact

# Execution

## Requirement

Once authenticated, validated, resolved, and credentialed, the Gateway MUST invoke the connector under an enforced wall-clock timeout (see `timeout.md`) and MUST observe the outcome whether the invocation succeeds, fails, or times out.

## `executed` invariant

`ExecutionProof.executed` answers one question only:

> **Did the Gateway actually invoke `connector.invoke()`?**

Therefore `executed` MUST be `true` once connector invocation has started, regardless of the final status. It MUST be `false` when the request is rejected before connector invocation.

| Situation | `executed` | `status` |
|---|---:|---|
| Connector executes and succeeds | `true` | `OK` |
| Connector executes and throws | `true` | `ERROR` |
| Connector invocation starts and exceeds the deadline | `true` | `TIMEOUT` |
| Authentication rejected before invocation | `false` | authentication error |
| Validation rejected before invocation | `false` | validation error |
| Unknown connector/operation | `false` | resolution error |
| Credential scope denied before invocation | `false` | `CREDENTIAL_DENIED` |
| Sandbox denied before invocation | `false` | `SANDBOX_DENIED` |
| Replay rejected before invocation | `false` | `REPLAY_DENIED` |

A successful status MUST NOT be used as a proxy for execution, and `executed` MUST NOT be used as a proxy for external side-effect success. A connector can execute and then fail, time out, or partially affect an external system.

## Failure and timeout

A connector that throws synchronously or via a rejected promise produces `status: "ERROR"` and `executed: true` because invocation occurred.

A connector that starts but does not complete within the Gateway deadline produces `status: "TIMEOUT"` and `executed: true`. Timeout handling MUST NOT retroactively claim that the connector was never invoked.

The Gateway MUST produce an `ExecutionProof` for these outcomes. A failed or timed-out execution is an observable execution event and MUST NOT disappear from the evidence trail.

## Pre-execution rejection

If authentication, validation, connector resolution, credential authorization, sandbox enforcement, or replay protection rejects the request before `connector.invoke()` starts, `executed` MUST remain `false`.

The rejection MUST be represented using the deterministic error/status model in `error-model.md` and MUST NOT invoke the connector.

## Reference implementation

`src/executor.ts` (`executeWithTimeout`) and `src/gateway.ts` (`Gateway.invoke`) implement the execution and observation stages.

## Conformance tests

The executable conformance suite MUST cover both dimensions independently:

- `test/conformance/execution.test.ts`: execution/error semantics and the `executed` invariant.
- `test/conformance/timeout.test.ts`: real timeout behavior with `executed: true`.

Current local evidence on the `feat/mcp-server` branch: **68/68 Gateway conformance tests pass**, including connector failure, timeout, and `executed` semantics. This is local evidence only; CI status is tracked separately by the repository workflow.