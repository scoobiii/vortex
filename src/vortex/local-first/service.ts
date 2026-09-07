import { sha256Json, sha256Text } from "./hash";
import { BenchmarkRecord, ExecutionProof } from "./types";
import { LocalFirstStore } from "./store";

export interface ExecutionInput {
  execution_id: string; agent: { provider: string; model?: string }; repository: { uri: string; base_commit: string };
  proposal: { proposal_id: string; change_hash: string }; command: string; exit_code: number; duration_ms: number;
  stdout?: string; stderr?: string; artifact_hashes?: string[]; tests?: { total: number; passed: number; failed: number };
  policy_version: string; created_at?: string;
}

export function buildExecutionProof(input: ExecutionInput): ExecutionProof {
  const proofWithoutHash = {
    protocol: "vortex-agent/v1" as const, proof_version: 1 as const, execution_id: input.execution_id,
    created_at: input.created_at ?? new Date().toISOString(), agent: input.agent, repository: input.repository,
    proposal: input.proposal,
    execution: { command: input.command, exit_code: input.exit_code, duration_ms: input.duration_ms, ...(input.tests ? { tests: input.tests } : {}) },
    evidence: { ...(input.stdout !== undefined ? { stdout_hash: sha256Text(input.stdout) } : {}), ...(input.stderr !== undefined ? { stderr_hash: sha256Text(input.stderr) } : {}), artifact_hashes: input.artifact_hashes ?? [] },
    policy: { version: input.policy_version },
  };
  return { ...proofWithoutHash, proof: { algorithm: "sha256", hash: sha256Json(proofWithoutHash) } };
}

export function buildBenchmark(proof: ExecutionProof, benchmarkId: string): BenchmarkRecord {
  const tests = proof.execution.tests ?? { total: 0, passed: 0, failed: 0 };
  return { benchmark_id: benchmarkId, execution_id: proof.execution_id, created_at: proof.created_at, agent: proof.agent, repository: proof.repository,
    result: proof.execution.exit_code === 0 && tests.failed === 0 ? "PASS" : "FAIL", duration_ms: proof.execution.duration_ms, tests, execution_proof_hash: proof.proof.hash };
}

export async function recordExecution(store: LocalFirstStore, input: ExecutionInput, benchmarkId = `benchmark-${input.execution_id}`): Promise<{ proof: ExecutionProof; benchmark: BenchmarkRecord }> {
  const proof = buildExecutionProof(input); const benchmark = buildBenchmark(proof, benchmarkId);
  await store.putProof(proof); await store.putBenchmark(benchmark); return { proof, benchmark };
}
