import { createServer, IncomingMessage, Server, ServerResponse } from "node:http";
import { LocalFirstStore } from "./store";
import { SyncBatch, SyncResult } from "./types";
import { validateBatch } from "./validation";

export interface SyncServerOptions { token?: string; host?: string; port?: number; }

export class SyncServer {
  private readonly server: Server;
  constructor(private readonly store: LocalFirstStore, private readonly options: SyncServerOptions = {}) { this.server = createServer((req, res) => { void this.handle(req, res); }); }
  async listen(): Promise<void> {
    const port = this.options.port ?? 8787; const host = this.options.host ?? "127.0.0.1";
    await new Promise<void>((resolve, reject) => {
      const onError = (error: Error) => { this.server.off("listening", onListening); reject(error); };
      const onListening = () => { this.server.off("error", onError); resolve(); };
      this.server.once("error", onError); this.server.once("listening", onListening); this.server.listen(port, host);
    });
  }
  async close(): Promise<void> { await new Promise<void>((resolve, reject) => this.server.close((error) => error ? reject(error) : resolve())); }
  private async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (req.method !== "POST" || req.url !== "/v1/sync") { this.write(res, 404, { error: "not_found" }); return; }
    if (this.options.token && req.headers.authorization !== `Bearer ${this.options.token}`) { this.write(res, 401, { error: "unauthorized" }); return; }
    try {
      const batch = JSON.parse(await readBody(req)) as unknown; validateBatch(batch); const b = batch as SyncBatch;
      for (const proof of b.proofs) await this.store.putProof(proof);
      for (const benchmark of b.benchmarks) await this.store.putBenchmark(benchmark);
      const result: SyncResult = { accepted_proofs: b.proofs.map((p) => p.proof.hash), accepted_benchmarks: b.benchmarks.map((x) => x.benchmark_id), rejected: [] };
      this.write(res, 200, result);
    } catch (error) { this.write(res, 400, { error: error instanceof Error ? error.message : "invalid_request" }); }
  }
  private write(res: ServerResponse, status: number, body: unknown): void { res.statusCode = status; res.setHeader("content-type", "application/json"); res.end(JSON.stringify(body)); }
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ""; let size = 0; req.setEncoding("utf8");
    req.on("data", (chunk: string) => { size += Buffer.byteLength(chunk); if (size > 5_000_000) { reject(new Error("payload_too_large")); req.destroy(); return; } data += chunk; });
    req.on("end", () => resolve(data)); req.on("error", reject);
  });
}
