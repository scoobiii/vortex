// **GOS3** · agente: GPT · papel: Runtime Loop Validator
import assert from "node:assert/strict";
import { initialLoop, nextState, type AttemptEvidence } from "../src/gos3/runtime-loop";

const ok = (overrides: Partial<AttemptEvidence> = {}): AttemptEvidence => ({
  status: "success",
  executed: true,
  evidence_hash: "evidence-1",
  runtime_id: "test-runtime",
  execution_id: "exec-1",
  duration_ms: 10,
  stdout: "ok",
  stderr: "",
  exit_code: 0,
  head_sha: "goodsha",
  outcome: "pass",
  ...overrides,
});

{
  const state = initialLoop({ max_attempts: 3, max_duration_ms: 1000 });
  const next = nextState(state, ok(), 10);
  assert.equal(next.state, "PR_READY");
}

{
  const state = initialLoop({ max_attempts: 3, max_duration_ms: 1000 });
  const next = nextState(state, ok({ outcome: "retryable_failure", status: "error", evidence_hash: "err-1", error: "test failed" }), 10);
  assert.equal(next.state, "RETRY");
}

{
  const state = { ...initialLoop({ max_attempts: 3, max_duration_ms: 1000 }), last_good_commit: "goodsha" };
  const next = nextState(state, ok({ outcome: "regression", status: "error", evidence_hash: "reg-1", head_sha: "badsha" }), 10);
  assert.equal(next.state, "ROLLBACK");
}

{
  const state = initialLoop({ max_attempts: 3, max_duration_ms: 1000 });
  const first = nextState(state, ok({ outcome: "retryable_failure", status: "error", evidence_hash: "same" }), 10);
  const second = nextState(first, ok({ outcome: "retryable_failure", status: "error", evidence_hash: "same" }), 20);
  assert.equal(second.state, "HELP_REQUIRED");
  assert.equal(second.help_request?.reason, "stagnated");
}

{
  const state = initialLoop({ max_attempts: 1, max_duration_ms: 1000 });
  const next = nextState(state, ok({ outcome: "retryable_failure", status: "error", evidence_hash: "err" }), 10);
  assert.equal(next.state, "HELP_REQUIRED");
  assert.equal(next.help_request?.reason, "attempt_limit");
}

console.log("runtime-loop tests: PASS");
