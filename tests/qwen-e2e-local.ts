/**
 * GOS3 · agente: GPT · papel: Maintainer / Engineering Agent
 * fase: Runtime Federation → Qwen Real E2E · data: 2026-09-07 · hora: 00:00
 * antes: test:qwen05b apenas imprimia a resposta e não falhava por ausência de execução real.
 * depois: E2E exige executed=true, IDs, saída, modelo e digests de modelo/runtime e grava evidência verificável.
 * base: feat/gos3-runtime-orchestration
 * assinatura: GPT · Maintainer / Engineering Agent · GOS3
 * commit: registered by Git
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import { invoke } from "../src/agents/qwen05b/adapter";

async function main(): Promise<void> {
  const result = await invoke(process.env.QWEN_E2E_PROMPT ?? "Reply exactly with QWEN_E2E_OK", {
    baseUrl: process.env.QWEN_BASE_URL,
    model: process.env.QWEN_MODEL,
    timeoutMs: Number(process.env.QWEN_TIMEOUT_MS ?? 120_000),
    modelDigest: process.env.QWEN_MODEL_DIGEST,
    runtimeDigest: process.env.QWEN_RUNTIME_DIGEST,
    runtimeVersion: process.env.QWEN_RUNTIME_VERSION,
  });

  assert.equal(result.executed, true, `Qwen did not execute: ${result.stderr}`);
  assert.equal(result.exit_code, 0);
  assert.ok(result.stdout.trim().length > 0, "Qwen returned empty stdout");
  assert.match(result.runtime_id, /^qwen-local-/);
  assert.match(result.execution_id, /^exec-/);
  assert.match(result.evidence_hash, /^[0-9a-f]{64}$/);
  assert.equal(result.model, process.env.QWEN_MODEL ?? "qwen2.5-coder:0.5b");
  assert.ok(result.model_digest, "QWEN_MODEL_DIGEST is required for real E2E provenance");
  assert.ok(result.runtime_digest, "QWEN_RUNTIME_DIGEST is required for real E2E provenance");
  assert.ok(result.runtime_version, "QWEN_RUNTIME_VERSION is required for real E2E provenance");

  const evidence = {
    ...result,
    generated_at: new Date().toISOString(),
    runner: process.env.GITHUB_RUNNER ?? "local",
    workflow: process.env.GITHUB_WORKFLOW ?? "local",
    run_id: process.env.GITHUB_RUN_ID ?? null,
    sha: process.env.GITHUB_SHA ?? null,
  };
  const output = process.env.QWEN_EVIDENCE_FILE ?? "qwen-evidence.json";
  fs.writeFileSync(output, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(evidence, null, 2));
  console.log(`QWEN REAL E2E: PASS · evidence=${output}`);
}

main().catch((error) => { console.error(error); process.exit(1); });
