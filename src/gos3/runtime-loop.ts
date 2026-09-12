// **GOS3** · agente: GPT · papel: Maintainer / Engineering Agent
// Bounded agent loop: sandbox execution is evidence-gated; no infinite autonomy.

export type LoopState =
  | "READY"
  | "RUNNING"
  | "VERIFYING"
  | "RETRY"
  | "ROLLBACK"
  | "PR_READY"
  | "STAGNATED"
  | "HELP_REQUIRED";

export type AttemptOutcome =
  | "pass"
  | "retryable_failure"
  | "regression"
  | "blocked";

export interface LoopLimits {
  max_attempts: number;
  max_duration_ms: number;
}

export interface AttemptEvidence {
  status: "success" | "error" | "partial" | "timeout";
  executed: boolean;
  evidence_hash?: string;
  runtime_id?: string;
  execution_id?: string;
  duration_ms: number;
  stdout: string;
  stderr: string;
  exit_code?: number;
  head_sha?: string;
  changed_files?: string[];
  outcome: AttemptOutcome;
  error?: string;
}

export interface HelpRequest {
  reason: "stagnated" | "blocked" | "attempt_limit" | "time_limit";
  attempt: number;
  max_attempts: number;
  last_error?: string;
  last_good_commit?: string;
  current_commit?: string;
  evidence_hashes: string[];
}

export interface LoopSnapshot {
  state: LoopState;
  attempt: number;
  limits: LoopLimits;
  last_good_commit?: string;
  current_commit?: string;
  evidence_hashes: string[];
  help_request?: HelpRequest;
}

export function assertLoopLimits(limits: LoopLimits): void {
  if (!Number.isInteger(limits.max_attempts) || limits.max_attempts < 1) {
    throw new Error("max_attempts must be a positive integer");
  }
  if (!Number.isFinite(limits.max_duration_ms) || limits.max_duration_ms < 1) {
    throw new Error("max_duration_ms must be positive");
  }
}

export function nextState(
  snapshot: LoopSnapshot,
  attempt: AttemptEvidence,
  elapsed_ms: number,
): LoopSnapshot {
  assertLoopLimits(snapshot.limits);

  const evidence_hashes = attempt.evidence_hash
    ? [...snapshot.evidence_hashes, attempt.evidence_hash]
    : snapshot.evidence_hashes;
  const base = {
    ...snapshot,
    state: "VERIFYING" as LoopState,
    evidence_hashes,
    current_commit: attempt.head_sha ?? snapshot.current_commit,
  };

  if (elapsed_ms >= snapshot.limits.max_duration_ms) {
    return help(base, "time_limit", attempt);
  }

  if (attempt.outcome === "pass") {
    if (!attempt.executed || attempt.status !== "success" || !attempt.evidence_hash) {
      return help(base, "blocked", attempt);
    }
    return { ...base, state: "PR_READY", last_good_commit: attempt.head_sha ?? snapshot.last_good_commit };
  }

  if (attempt.outcome === "blocked") {
    return help(base, "blocked", attempt);
  }

  if (attempt.outcome === "regression") {
    if (!snapshot.last_good_commit) return help(base, "stagnated", attempt);
    if (snapshot.attempt >= snapshot.limits.max_attempts) return help(base, "attempt_limit", attempt);
    return { ...base, state: "ROLLBACK" };
  }

  if (snapshot.attempt >= snapshot.limits.max_attempts) {
    return help(base, "attempt_limit", attempt);
  }

  const prior = snapshot.evidence_hashes[snapshot.evidence_hashes.length - 1];
  if (attempt.evidence_hash && attempt.evidence_hash === prior) {
    return help(base, "stagnated", attempt);
  }

  return { ...base, state: "RETRY", attempt: snapshot.attempt + 1 };
}

function help(
  snapshot: LoopSnapshot,
  reason: HelpRequest["reason"],
  attempt: AttemptEvidence,
): LoopSnapshot {
  return {
    ...snapshot,
    state: "HELP_REQUIRED",
    help_request: {
      reason,
      attempt: snapshot.attempt,
      max_attempts: snapshot.limits.max_attempts,
      last_error: attempt.error || attempt.stderr || undefined,
      last_good_commit: snapshot.last_good_commit,
      current_commit: snapshot.current_commit,
      evidence_hashes: snapshot.evidence_hashes,
    },
  };
}

export function initialLoop(limits: LoopLimits): LoopSnapshot {
  assertLoopLimits(limits);
  return {
    state: "READY",
    attempt: 1,
    limits,
    evidence_hashes: [],
  };
}
