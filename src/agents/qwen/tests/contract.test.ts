/**
 * GOS3 · agente: qwen · papel: Agent Adapter / Ollama
 * fase: Qwen connector reorganization · data: 2026-09-06
 * base: a9083f0 · assinatura: GPT · Engineering Agent · GOS3
 */

import { invoke } from "../adapter";
import { isContractCompliant } from "../adapter/contract";

const originalFetch = globalThis.fetch;
let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) { console.log(`  ✓ ${message}`); passed++; }
  else { console.error(`  ✗ ${message}`); failed++; }
}

async function run() {
  console.log("\n=== Qwen Connector Contract Tests ===\n");

  globalThis.fetch = (async () => new Response(JSON.stringify({
    model: "qwen2.5-coder:0.5b",
    response: "VORTEX-QWEN-OK",
    done: true,
    done_reason: "stop",
    prompt_eval_count: 3,
    eval_count: 5,
    eval_duration: 1000,
    total_duration: 2000,
  }), { status: 200, headers: { "content-type": "application/json" } })) as typeof fetch;

  const res = await invoke({
    invocation_id: "qwen-test-001",
    agent: "qwen",
    action: "generate",
    payload: { prompt: "Responda exatamente: VORTEX-QWEN-OK" },
    context: { sandbox: true },
  });
  assert(res.executed === true, "done + eval_count + eval_duration → executed=true");
  assert(res.error === null, "error=null");
  assert(res.agent === "qwen", "agent=qwen");
  assert(isContractCompliant(res), "shape do contrato válido");

  const dry = await invoke({
    invocation_id: "qwen-test-002",
    agent: "qwen",
    action: "generate",
    payload: { prompt: "não deve executar" },
    context: { sandbox: true, dry_run: true },
  });
  assert(dry.executed === false, "dry_run → executed=false");
  assert(isContractCompliant(dry), "shape do contrato válido em dry_run");

  const bad = await invoke({
    invocation_id: "qwen-test-003",
    agent: "claude",
    action: "generate",
    payload: { prompt: "x" },
  });
  assert(bad.executed === false, "agent incorreto → executed=false");
  assert(isContractCompliant(bad), "shape do contrato válido em erro");

  globalThis.fetch = originalFetch;
  console.log(`\n=== Resultado: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  globalThis.fetch = originalFetch;
  console.error(err);
  process.exit(1);
});
