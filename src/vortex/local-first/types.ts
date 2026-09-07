export interface ExecutionProof {
  protocol: "vortex-agent/v1";
  proof_version: 1;
  execution_id: string;
  created_at: string;
  agent: { provider: string; model?: string };
  repository: { uri: string; base_commit: string };
  proposal: { proposal_id: string; change_hash: string };
  execution: { command: string; exit_code: number; duration_ms: number; tests?: { total: number; passed: number; failed: number } };
  evidence: { stdout_hash?: string; stderr_hash?: string; artifact_hashes: string[] };
  policy: { version: string };
  proof: { algorithm: "sha256"; hash: string };
}

export interface BenchmarkRecord {
  benchmark_id: string;
  execution_id: string;
  created_at: string;
  agent: { provider: string; model?: string };
  repository: { uri: string; base_commit: string };
  result: "PASS" | "FAIL";
  duration_ms: number;
  tests: { total: number; passed: number; failed: number };
  execution_proof_hash: string;
}

export interface SyncBatch {
  protocol: "vortex-sync/v1";
  device_id: string;
  proofs: ExecutionProof[];
  benchmarks: BenchmarkRecord[];
}

export interface SyncResult {
  accepted_proofs: string[];
  accepted_benchmarks: string[];
  rejected: Array<{ id: string; reason: string }>;
}
