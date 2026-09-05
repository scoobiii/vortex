#!/usr/bin/env node
/**
 * GOS3 · Direct vs Vortex local execution proof.
 * Request identity excludes invocation_id; execution evidence binds it.
 */

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
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

function stableRequest(request) {
  const { invocation_id, ...stable } = request;
  return stable;
}

async function direct(request) {
  const stable = stableRequest(request);
  const requestHash = sha256(canonical(stable));
  const started = process.hrtime.bigint();
  const response = await fetch(`${BASE_URL.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: canonical(stable),
  });
  const text = await response.text();
  const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
  if (!response.ok) throw new Error(`direct HTTP ${response.status}: ${text.slice(0, 500)}`);
  const parsed = JSON.parse(text);
  const output = parsed.choices?.[0]?.message?.content ?? "";
  const completionTokens = Number(parsed.usage?.completion_tokens || 0);
  if (!parsed.id || !output || !Number.isInteger(completionTokens) || completionTokens <= 0) {
    throw new Error("direct execution unproven: incomplete completion evidence");
  }
  return {
    mode: "direct",
    invocation_id: request.invocation_id,
    executed: true,
    exit_code: 0,
    duration_ms: durationMs,
    completion_tokens: completionTokens,
    tok_per_s: completionTokens / (durationMs / 1000),
    request_hash: requestHash,
    stdout_hash: sha256(text),
    output_hash: sha256(output),
    output,
  };
}

async function main() {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });

  const directRequest = requestFor("proof-direct-001");
  const vortexRequest = requestFor("proof-vortex-001");
  const requestHash = sha256(canonical(stableRequest(directRequest)));

  if (requestHash !== sha256(canonical(stableRequest(vortexRequest)))) {
    throw new Error("SECURITY GATE: direct and Vortex stable requests differ");
  }

  // Determinism is an explicit measured property of this pinned run, not an assumption.
  const directA = await direct(directRequest);
  const directB = await direct(directRequest);
  const deterministic = directA.output_hash === directB.output_hash;
  if (!deterministic) throw new Error("DETERMINISM GATE: repeated direct execution produced different output");

  const vortexResult = await invoke(vortexRequest, { baseUrl: BASE_URL });
  if (!vortexResult.executed) throw new Error(`Vortex execution failed: ${vortexResult.error || "unknown error"}`);
  if (vortexResult.invocation_id !== vortexRequest.invocation_id) throw new Error("SECURITY GATE: invocation_id was not propagated");
  if (!vortexResult.execution_evidence?.evidence_hash) throw new Error("SECURITY GATE: missing execution evidence");

  const sameOutput = directA.output_hash === vortexResult.output.output_hash;
  const overheadMs = vortexResult.duration_ms - directA.duration_ms;
  const overheadPct = directA.duration_ms > 0 ? (overheadMs / directA.duration_ms) * 100 : 0;

  const proof = {
    schema: "vortex.execution-proof.v1",
    claim: "direct-vs-vortex-local-qwen",
    model: MODEL,
    model_family: "Qwen2.5-Coder-0.5B-Instruct-GGUF",
    runtime_id: `github-hosted/${process.env.RUNNER_OS || "unknown"}/${process.env.RUNNER_ARCH || "unknown"}`,
    llama_cpp: process.env.LLAMA_CPP_VERSION || "b10516",
    prompt_sha256: sha256(PROMPT),
    request_hash: requestHash,
    deterministic_settings: { temperature: 0, seed: 42, max_tokens: 96 },
    direct: { ...directA, repeat_output_hash: directB.output_hash },
    vortex: vortexResult,
    comparison: {
      same_request: true,
      deterministic,
      same_output: sameOutput,
      overhead_ms: overheadMs,
      overhead_percent: overheadPct,
      evidence_present: Boolean(vortexResult.execution_evidence?.evidence_hash),
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
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
