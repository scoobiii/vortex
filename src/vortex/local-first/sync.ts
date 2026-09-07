import { LocalFirstStore } from "./store";
import { BenchmarkRecord, ExecutionProof, SyncBatch, SyncResult } from "./types";

export interface SyncTransport { send(batch: SyncBatch): Promise<SyncResult>; }

export class HttpSyncTransport implements SyncTransport {
  constructor(private readonly endpoint: string, private readonly token?: string) {}
  async send(batch: SyncBatch): Promise<SyncResult> {
    const response = await fetch(this.endpoint, { method: "POST", headers: { "content-type": "application/json", ...(this.token ? { authorization: `Bearer ${this.token}` } : {}) }, body: JSON.stringify(batch) });
    if (!response.ok) throw new Error(`sync HTTP ${response.status}`);
    return (await response.json()) as SyncResult;
  }
}

export async function syncOnce(store: LocalFirstStore, deviceId: string, transport: SyncTransport): Promise<SyncResult> {
  const [proofs, benchmarks] = await Promise.all([store.pendingProofs(), store.pendingBenchmarks()]);
  const batch: SyncBatch = { protocol: "vortex-sync/v1", device_id: deviceId, proofs: proofs as ExecutionProof[], benchmarks: benchmarks as BenchmarkRecord[] };
  if (batch.proofs.length === 0 && batch.benchmarks.length === 0) return { accepted_proofs: [], accepted_benchmarks: [], rejected: [] };
  const result = await transport.send(batch);
  await store.markProofsSynced(result.accepted_proofs);
  await store.markBenchmarksSynced(result.accepted_benchmarks);
  return result;
}
