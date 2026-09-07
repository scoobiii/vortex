import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { BenchmarkRecord, ExecutionProof } from "./types";

interface SyncState { proofs: string[]; benchmarks: string[]; }

export class LocalFirstStore {
  private readonly proofsDir: string;
  private readonly benchmarksDir: string;
  private readonly stateFile: string;
  private state: SyncState = { proofs: [], benchmarks: [] };

  private constructor(private readonly root: string) {
    this.proofsDir = join(root, "proofs");
    this.benchmarksDir = join(root, "benchmarks");
    this.stateFile = join(root, "sync-state.json");
  }

  static async open(root: string): Promise<LocalFirstStore> {
    const store = new LocalFirstStore(root);
    await mkdir(store.proofsDir, { recursive: true });
    await mkdir(store.benchmarksDir, { recursive: true });
    try { store.state = JSON.parse(await readFile(store.stateFile, "utf8")) as SyncState; }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      await store.persistState();
    }
    return store;
  }

  async putProof(proof: ExecutionProof): Promise<void> {
    await this.atomicJson(join(this.proofsDir, `${proof.proof.hash.replace(/[^a-zA-Z0-9_.-]/g, "_")}.json`), proof);
  }

  async putBenchmark(benchmark: BenchmarkRecord): Promise<void> {
    await this.atomicJson(join(this.benchmarksDir, `${benchmark.benchmark_id}.json`), benchmark);
  }

  async pendingProofs(): Promise<ExecutionProof[]> { return this.readPending(this.proofsDir, this.state.proofs) as Promise<ExecutionProof[]>; }
  async pendingBenchmarks(): Promise<BenchmarkRecord[]> { return this.readPending(this.benchmarksDir, this.state.benchmarks) as Promise<BenchmarkRecord[]>; }

  async markProofsSynced(ids: string[]): Promise<void> {
    for (const id of ids) if (!this.state.proofs.includes(id)) this.state.proofs.push(id);
    await this.persistState();
  }

  async markBenchmarksSynced(ids: string[]): Promise<void> {
    for (const id of ids) if (!this.state.benchmarks.includes(id)) this.state.benchmarks.push(id);
    await this.persistState();
  }

  async status(): Promise<{ pending_proofs: number; pending_benchmarks: number; synced_proofs: number; synced_benchmarks: number }> {
    const [proofs, benchmarks] = await Promise.all([this.pendingProofs(), this.pendingBenchmarks()]);
    return { pending_proofs: proofs.length, pending_benchmarks: benchmarks.length, synced_proofs: this.state.proofs.length, synced_benchmarks: this.state.benchmarks.length };
  }

  private async readPending(dir: string, synced: string[]): Promise<unknown[]> {
    const files = (await readdir(dir)).filter((name) => name.endsWith(".json"));
    const records: unknown[] = [];
    for (const file of files) {
      const record = JSON.parse(await readFile(join(dir, file), "utf8")) as Record<string, unknown>;
      const id = typeof record.proof === "object" && record.proof !== null && "hash" in record.proof
        ? String((record.proof as Record<string, unknown>).hash) : String(record.benchmark_id);
      if (!synced.includes(id)) records.push(record);
    }
    return records;
  }

  private async persistState(): Promise<void> { await this.atomicJson(this.stateFile, this.state); }
  private async atomicJson(path: string, value: unknown): Promise<void> {
    await mkdir(dirname(path), { recursive: true });
    const temp = `${path}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    await rename(temp, path);
  }
}
