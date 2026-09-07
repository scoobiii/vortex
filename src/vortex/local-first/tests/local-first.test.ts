// Vortex / GOS3 v2.4 — Local-first Runtime Tests
// Rule: mexeu → testa → valida → publica.
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildBenchmark, buildExecutionProof, recordExecution } from "../service";
import { canonicalize } from "../canonical-json";
import { sha256Json } from "../hash";
import { LocalFirstStore } from "../store";
import { HttpSyncTransport, syncOnce } from "../sync";
import { SyncBatch, SyncResult } from "../types";

let passed = 0; let failed = 0;
function assert(condition: boolean, message: string): void { if (condition) { console.log(`✓ ${message}`); passed++; } else { console.error(`✗ ${message}`); failed++; } }

async function run(): Promise<void> {
  console.log("\n=== Local-first / Execution Proof tests ===\n");
  assert(canonicalize({ b: 2, a: 1 }) === canonicalize({ a: 1, b: 2 }), "canonicalização determinística");
  assert(sha256Json({ b: 2, a: 1 }) === sha256Json({ a: 1, b: 2 }), "hash JSON independente da ordem das chaves");
  const root = await mkdtemp(join(tmpdir(), "vortex-test-"));
  try {
    const store = await LocalFirstStore.open(root);
    const input = { execution_id: "E-local-001", agent: { provider: "test", model: "local" }, repository: { uri: "file:///workspace/vortex", base_commit: "abc123" }, proposal: { proposal_id: "P001", change_hash: "sha256:change" }, command: "npm test", exit_code: 0, duration_ms: 42, stdout: "184 passed", stderr: "", artifact_hashes: ["sha256:artifact"], tests: { total: 184, passed: 184, failed: 0 }, policy_version: "policy-v1", created_at: "2026-09-07T00:00:00.000Z" };
    const proofA = buildExecutionProof(input); const proofB = buildExecutionProof(input);
    assert(proofA.proof.hash === proofB.proof.hash, "mesma execução produz o mesmo proof hash");
    assert(buildBenchmark(proofA, "B001").result === "PASS", "benchmark PASS para exit 0 sem falhas");
    await recordExecution(store, input, "B001");
    let status = await store.status();
    assert(status.pending_proofs === 1 && status.pending_benchmarks === 1, "prova e benchmark ficam persistidos offline");
    const offlineTransport = new HttpSyncTransport("http://127.0.0.1:1/v1/sync");
    let offlineFailed = false;
    try { await syncOnce(store, "device-test", offlineTransport); } catch { offlineFailed = true; }
    assert(offlineFailed, "falha de conectividade é reportada sem mascarar o erro");
    status = await store.status();
    assert(status.pending_proofs === 1 && status.pending_benchmarks === 1, "fila permanece pendente após falha de rede");
    const transport: { send(batch: SyncBatch): Promise<SyncResult> } = { async send(batch: SyncBatch): Promise<SyncResult> { assert(batch.protocol === "vortex-sync/v1", "batch usa protocolo de sincronização v1"); return { accepted_proofs: batch.proofs.map((p) => p.proof.hash), accepted_benchmarks: batch.benchmarks.map((b) => b.benchmark_id), rejected: [] }; } };
    const result = await syncOnce(store, "device-test", transport);
    assert(result.accepted_proofs.length === 1 && result.accepted_benchmarks.length === 1, "sync aceita proof e benchmark");
    status = await store.status();
    assert(status.pending_proofs === 0 && status.pending_benchmarks === 0, "itens aceitos saem da fila offline");
    assert((await syncOnce(store, "device-test", transport)).accepted_proofs.length === 0, "sync idempotente quando fila está vazia");
  } finally { await rm(root, { recursive: true, force: true }); }
  console.log(`\n=== Resultado: ${passed} passed, ${failed} failed ===\n`); process.exit(failed > 0 ? 1 : 0);
}
run().catch((error) => { console.error(error); process.exit(1); });
