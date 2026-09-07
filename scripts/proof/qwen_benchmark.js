#!/usr/bin/env node
/**
 * Data:            2026-09-05
 * Diretório:       scripts/proof/qwen_benchmark.js
  * Responsabilidade: Executa prova comparativa direct vs Vortex no modelo Qwen local.
 * Versão:          1.0.0
 * Assinatura:      vortex <sobrinhosj@gmail.com>
 */


/**
 * GOS3 · Direct vs Vortex local execution proof.
 * Same request, same local model, same server, same process.
 */

const fs = require("node:fs");
const os = require("node:os");
const { invoke, sha256, canonical } = require("./vortex_qwen_adapter");

const BASE_URL = process.env.VORTEX_LLM_BASE_URL || "http://127.0.0.1:8080/v1";
const MODEL = process.env.VORTEX_LLM_MODEL || "qwen2.5-coder-0.5b-instruct";
const OUT = process.env.PROOF_OUTPUT || "proof/results.json";
const PROMPT = "Write a JavaScript function that returns the nth Fibonacci number. Keep it concise and include one example call.";

function requestFor(invocationId) {
  return {
    model: MODEL,
    messages: [{ role: "user", content: PROMPT }],
    max_tokens: 96,
    temperature: 0,
    seed: 42,
    stream: false,
    invocation_id: invocationId,
  };
}

function withoutInvocationId(request) {
  const { invocation_id, ...stable } = request;
  return stable;
}

async function direct(request) {
  const stableRequest = withoutInvocationId(request);
  const requestJson = canonical(stableRequest);
  const requestHash = sha256(requestJson);
  const started = process.hrtime.bigint();
  const response = await fetch(`${BASE_URL.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: requestJson,
  });
  const text = await response.text();
  const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
  if (!response.ok) throw new Error(`direct HTTP ${response.status}: ${text.slice(0, 500)}`);
  const parsed = JSON.parse(text);
  const completionTokens = Number(parsed.usage?.completion_tokens || 0);
  const output = parsed.choices?.[0]?.message?.content ?? "";
  return {
    mode: "direct",
    executed: true,
    exit_code: 0,
    duration_ms: durationMs,
    completion_tokens: completionTokens,
    tok_per_s: completionTokens > 0 ? completionTokens / (durationMs / 1000) : 0,
    request_hash: requestHash,
    stdout_hash: sha256(text),
    output_hash: sha256(output),
    output,
  };
}

async function main() {
  fs.mkdirSync(require("node:path").dirname(OUT), { recursive: true });

  const directRequest = requestFor("proof-direct-001");
  const vortexRequest = requestFor("proof-vortex-001");
  const directStable = withoutInvocationId(directRequest);
  const vortexStable = withoutInvocationId(vortexRequest);
  const canonicalDirect = canonical(directStable);
  const canonicalVortex = canonical(vortexStable);

  if (sha256(canonicalDirect) !== sha256(canonicalVortex)) {
    throw new Error("SECURITY GATE: direct and Vortex requests are not byte-equivalent");
  }

  const directResult = await direct(directRequest);
  const vortexResult = await invoke(vortexStable, { baseUrl: BASE_URL });
  if (!vortexResult.executed) throw new Error(`Vortex execution failed: ${vortexResult.error || "unknown error"}`);

  const sameOutput = directResult.output_hash === vortexResult.output_hash;
  const overheadMs = vortexResult.duration_ms - directResult.duration_ms;
  const overheadPct = directResult.duration_ms > 0 ? (overheadMs / directResult.duration_ms) * 100 : 0;

  const proof = {
    schema: "vortex.execution-proof.v1",
    claim: "direct-vs-vortex-local-qwen",
    model: MODEL,
    model_family: "Qwen2.5-Coder-0.5B-Instruct-GGUF",
    runtime_id: `github-hosted/${process.env.RUNNER_OS || "unknown"}/${process.env.RUNNER_ARCH || "unknown"}`,
    llama_cpp: process.env.LLAMA_CPP_VERSION || "b10516",
    prompt_sha256: sha256(PROMPT),
    request_hash: directResult.request_hash,
    deterministic_settings: { temperature: 0, seed: 42, max_tokens: 96 },
    direct: directResult,
    vortex: vortexResult,
    comparison: {
      same_request: true,
      same_output: sameOutput,
      overhead_ms: overheadMs,
      overhead_percent: overheadPct,
      evidence_present: Boolean(vortexResult.evidence_hash),
    },
    host: {
      platform: process.platform,
      arch: process.arch,
      node: process.version,
      cpu_count: os.cpus().length,
    },
  };

  fs.writeFileSync(OUT, JSON.stringify(proof, null, 2) + "\n");
  console.log(JSON.stringify(proof, null, 2));

  if (!sameOutput) process.exitCode = 2;
  if (!vortexResult.evidence_hash) process.exitCode = 3;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
