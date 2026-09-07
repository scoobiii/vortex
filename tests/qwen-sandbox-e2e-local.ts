/**
 * GOS3
 * arquivo: tests/qwen-sandbox-e2e-local.ts
 * responsabilidade: E2E real do Qwen no sandbox após onboarding GOS3
 * agente: agent/llm
 * papel: Engineering Agent
 * fase: onboard
 * data: 2026-09-07
 * hora: 18:08
 * antes: sha256:pending
 * depois: pending
 * base: commit:1a4f271425f6ce8ebbad8c8aae0bd75a59a9c787
 * assinatura: P0 scoobiii : Agente GPT
 * commit: pending
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import { invokeInSandbox } from "../src/agents/qwen05b/adapter";
import { onboardFile, preflightChangedFile } from "../src/gos3/onboard";

async function main(): Promise<void> {
  const original = "export const answer = 41;\n";
  const session = onboardFile(original, {
    file: "sandbox/qwen-example.ts",
    responsabilidade: "real Qwen sandbox onboarding E2E",
    agente: "agent/llm",
    papel: "Engineering Agent",
    baseCommit: process.env.GITHUB_SHA ?? "local",
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toISOString().slice(11, 19),
  });

  const result = await invokeInSandbox(
    session,
    "Return ONLY the complete file body. Change exactly 41 to 42. Preserve the TypeScript statement and newline.",
    {
      baseUrl: process.env.QWEN_BASE_URL,
      model: process.env.QWEN_MODEL,
      timeoutMs: Number(process.env.QWEN_TIMEOUT_MS ?? 120_000),
      modelDigest: process.env.QWEN_MODEL_DIGEST,
      runtimeDigest: process.env.QWEN_RUNTIME_DIGEST,
      runtimeVersion: process.env.QWEN_RUNTIME_VERSION,
    },
  );

  assert.equal(result.evidence.executed, true, `Qwen did not execute: ${result.evidence.stderr}`);
  assert.equal(result.evidence.exit_code, 0);
  assert.ok(result.change, "Qwen executed but sandbox change was not produced");
  assert.equal(result.change?.header.fase, "implementation");
  assert.equal(result.change?.header.commit, "pending");
  assert.notEqual(result.change?.header.antes, result.change?.header.depois);
  assert.match(result.change?.header.antes ?? "", /^sha256:[0-9a-f]{64}$/);
  assert.match(result.change?.header.depois ?? "", /^sha256:[0-9a-f]{64}$/);
  assert.match(result.change?.content ?? "", /GOS3/);
  assert.match(result.change?.content ?? "", /answer\s*=\s*42/);
  preflightChangedFile(result.change!.content, "sandbox/qwen-example.ts");

  const evidence = {
    qwen: result.evidence,
    sandbox: result.change,
    generated_at: new Date().toISOString(),
    runner: process.env.GITHUB_RUNNER ?? "local",
    workflow: process.env.GITHUB_WORKFLOW ?? "local",
    run_id: process.env.GITHUB_RUN_ID ?? null,
    sha: process.env.GITHUB_SHA ?? null,
  };
  const output = process.env.QWEN_SANDBOX_EVIDENCE_FILE ?? "qwen-sandbox-evidence.json";
  fs.writeFileSync(output, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(evidence, null, 2));
  console.log(`QWEN REAL SANDBOX E2E: PASS · evidence=${output}`);
}

main().catch((error) => { console.error(error); process.exit(1); });
