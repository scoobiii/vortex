// Vortex / GOS3 v2.4 — Local-first Runtime
// Rule: mexeu → testa → valida → publica.
import { SyncBatch } from "./types";

export function validateBatch(value: unknown): asserts value is SyncBatch {
  if (!value || typeof value !== "object") throw new Error("batch must be object");
  const b = value as Record<string, unknown>;
  if (b.protocol !== "vortex-sync/v1") throw new Error("unsupported sync protocol");
  if (typeof b.device_id !== "string" || b.device_id.length === 0 || b.device_id.length > 256) throw new Error("invalid device_id");
  if (!Array.isArray(b.proofs) || !Array.isArray(b.benchmarks)) throw new Error("proofs and benchmarks must be arrays");
  if (b.proofs.length + b.benchmarks.length > 1000) throw new Error("batch_too_large");
  for (const proof of b.proofs) {
    if (!proof || typeof proof !== "object") throw new Error("invalid proof");
    const p = proof as Record<string, unknown>;
    if (p.protocol !== "vortex-agent/v1" || p.proof_version !== 1) throw new Error("invalid proof protocol");
    if (typeof p.execution_id !== "string" || !p.execution_id) throw new Error("invalid execution_id");
    if (!p.proof || typeof p.proof !== "object") throw new Error("missing proof hash");
    const hash = (p.proof as Record<string, unknown>).hash;
    if (typeof hash !== "string" || !/^sha256:[a-f0-9]{64}$/.test(hash)) throw new Error("invalid proof hash");
  }
  for (const benchmark of b.benchmarks) {
    if (!benchmark || typeof benchmark !== "object") throw new Error("invalid benchmark");
    const x = benchmark as Record<string, unknown>;
    if (typeof x.benchmark_id !== "string" || !x.benchmark_id) throw new Error("invalid benchmark_id");
    if (x.result !== "PASS" && x.result !== "FAIL") throw new Error("invalid benchmark result");
  }
}
