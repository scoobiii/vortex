/**
 * GOS3 · agente: GPT · papel: Maintainer / Engineering Agent
 * fase: Runtime Federation → Qwen Contract Gate · data: 2026-09-07 · hora: 00:00
 * antes: não havia teste automatizado para erros, timeout e resposta OpenAI-compatible do Qwen adapter.
 * depois: contrato é validado com servidor HTTP local controlado, sem confundir mock com E2E do modelo.
 * base: feat/gos3-runtime-orchestration
 * assinatura: GPT · Maintainer / Engineering Agent · GOS3
 * commit: registered by Git
 */

import assert from "node:assert/strict";
import http from "node:http";
import { invoke } from "../adapter";

async function withServer(handler: http.RequestListener, fn: (baseUrl: string) => Promise<void>): Promise<void> {
  const server = http.createServer(handler);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("failed to bind test server");
  try { await fn(`http://127.0.0.1:${address.port}/v1`); }
  finally { await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
}

async function main(): Promise<void> {
  await withServer((_req, res) => {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ choices: [{ message: { content: "QWEN_CONTRACT_OK" } }] }));
  }, async (baseUrl) => {
    const result = await invoke("contract prompt", {
      baseUrl,
      model: "test-qwen",
      timeoutMs: 2_000,
      modelDigest: "sha256:test-model",
      runtimeDigest: "sha256:test-runtime",
      runtimeVersion: "test-runtime-1",
    });
    assert.equal(result.executed, true);
    assert.equal(result.exit_code, 0);
    assert.equal(result.stdout, "QWEN_CONTRACT_OK");
    assert.match(result.evidence_hash, /^[0-9a-f]{64}$/);
    assert.equal(result.model_digest, "sha256:test-model");
    assert.equal(result.runtime_digest, "sha256:test-runtime");
  });

  await withServer((_req, res) => {
    res.writeHead(500, { "content-type": "text/plain" });
    res.end("server failure");
  }, async (baseUrl) => {
    const result = await invoke("error prompt", { baseUrl, timeoutMs: 2_000 });
    assert.equal(result.executed, false);
    assert.equal(result.exit_code, 1);
    assert.match(result.stderr, /Qwen endpoint 500/);
    assert.match(result.evidence_hash, /^[0-9a-f]{64}$/);
  });

  await withServer(async (_req, res) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ choices: [{ message: { content: "late" } }] }));
  }, async (baseUrl) => {
    const result = await invoke("timeout prompt", { baseUrl, timeoutMs: 20 });
    assert.equal(result.executed, false);
    assert.equal(result.exit_code, 1);
    assert.match(result.stderr, /timeout after 20ms/);
  });

  console.log("QWEN CONTRACT: PASS");
}

main().catch((error) => { console.error(error); process.exit(1); });
