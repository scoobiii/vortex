import { strict as assert } from "node:assert";
import { ollamaConnector } from "./ollama";

const originalFetch = globalThis.fetch;

async function run(): Promise<void> {
  globalThis.fetch = (async () => new Response(JSON.stringify({
    id: "chatcmpl-test",
    model: "qwen2.5-coder:0.5b",
    choices: [{ message: { content: "pong" } }],
    usage: { prompt_tokens: 4, completion_tokens: 1, total_tokens: 5 },
  }), { status: 200, headers: { "content-type": "application/json" } })) as typeof fetch;

  const ok = await ollamaConnector.invoke({
    input: { model: "qwen2.5-coder:0.5b", messages: [{ role: "user", content: "pong" }] },
  });

  assert.equal(ok.ok, true);
  assert.equal(ok.output, "pong");
  assert.equal(ok.providerUsed, "ollama");
  assert.equal(ok.modelUsed, "qwen2.5-coder:0.5b");
  assert.match(ok.evidenceHash ?? "", /^[a-f0-9]{64}$/);

  globalThis.fetch = (async () => new Response("offline", { status: 503 })) as typeof fetch;
  const offline = await ollamaConnector.invoke({
    input: { model: "qwen2.5-coder:0.5b", messages: [{ role: "user", content: "pong" }] },
  });
  assert.equal(offline.ok, false);
  assert.equal(offline.output, undefined);
  assert.equal(offline.providerUsed, undefined);
  assert.equal(offline.modelUsed, undefined);

  globalThis.fetch = originalFetch;
}

run().catch((error) => {
  globalThis.fetch = originalFetch;
  console.error(error);
  process.exitCode = 1;
});
