// GOS3
// agente: GPT
// papel: Maintainer / Engineering Agent
// fase: Runtime Federation → Ollama Connector Test
// data: 2026-09-07
// hora: 00:00
// antes: no explicit Ollama connector contract test
// depois: connector delegates to the known working Qwen/Ollama path
// base: Qwen contract test
// assinatura: agent/llm · Engineering Agent · GOS3
// commit: registered by Git

import assert from "node:assert/strict";
import { createServer } from "node:http";
import { invoke } from "../adapter/index";

void (async () => {
  const server = createServer((_req, res) => {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ choices: [{ message: { content: "OLLAMA_CONNECTOR_OK" } }] }));
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("failed to bind test server");

  try {
    const evidence = await invoke("connector test", {
      baseUrl: `http://127.0.0.1:${address.port}/v1`,
      model: "qwen2.5-coder:0.5b",
      modelDigest: "test-model-digest",
      runtimeDigest: "test-runtime-digest",
      runtimeVersion: "test-runtime-version"
    });

    assert.equal(evidence.executed, true);
    assert.equal(evidence.stdout, "OLLAMA_CONNECTOR_OK");
    assert.equal(evidence.model_digest, "test-model-digest");
    assert.equal(evidence.runtime_digest, "test-runtime-digest");
    assert.match(evidence.evidence_hash, /^[a-f0-9]{64}$/);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }

  console.log("OLLAMA_CONNECTOR_CONTRACT_OK");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
