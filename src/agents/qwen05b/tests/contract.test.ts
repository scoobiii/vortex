/**
 * GOS3
 * arquivo: src/agents/qwen05b/tests/contract.test.ts
 * responsabilidade: contrato do Qwen e regressão da integração sandbox/onboard
 * agente: agent/llm
 * papel: Engineering Agent
 * fase: implementation
 * data: 2026-09-07
 * hora: 18:06
 * antes: sha256:6d84fafe15891ed8c7490937b0bfbb1c81e56cfb
 * depois: sha256:pending
 * base: commit:1a4f271425f6ce8ebbad8c8aae0bd75a59a9c787
 * assinatura: P0 scoobiii : Agente GPT
 * commit: pending
 */

import assert from "node:assert/strict";
import http from "node:http";
import { invoke, invokeInSandbox } from "../adapter";
import { onboardFile } from "../../../gos3/onboard";

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

  await withServer((req, res) => {
    let requestBody = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => { requestBody += chunk; });
    req.on("end", () => {
      const request = JSON.parse(requestBody) as { messages?: Array<{ content?: string }> };
      const prompt = request.messages?.[0]?.content ?? "";
      assert.match(prompt, /GOS3 SANDBOX ONBOARD/);
      assert.match(prompt, /arquivo: src\/example\.ts/);
      assert.match(prompt, /fase: onboard/);
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ choices: [{ message: { content: "export const answer = 42;\n" } }] }));
    });
  }, async (baseUrl) => {
    const session = onboardFile("export const answer = 41;\n", {
      file: "src/example.ts",
      responsabilidade: "exemplo executável para teste de Qwen sandbox",
      baseCommit: "abc123",
      date: "2026-09-07",
      time: "18:06",
    });
    const result = await invokeInSandbox(session, "change answer from 41 to 42", {
      baseUrl,
      model: "test-qwen",
      timeoutMs: 2_000,
      modelDigest: "sha256:test-model",
      runtimeDigest: "sha256:test-runtime",
      runtimeVersion: "test-runtime-1",
    });
    assert.equal(result.evidence.executed, true);
    assert.ok(result.change);
    assert.equal(result.change?.header.fase, "implementation");
    assert.equal(result.change?.header.commit, "pending");
    assert.match(result.change?.header.antes ?? "", /^sha256:[0-9a-f]{64}$/);
    assert.match(result.change?.header.depois ?? "", /^sha256:[0-9a-f]{64}$/);
    assert.match(result.change?.content ?? "", /GOS3/);
    assert.match(result.change?.content ?? "", /answer = 42/);
  });

  console.log("QWEN CONTRACT: PASS");
}

main().catch((error) => { console.error(error); process.exit(1); });
