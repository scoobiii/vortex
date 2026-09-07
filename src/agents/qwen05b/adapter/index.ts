/**
 * GOS3 · agente: GPT · papel: Maintainer / Engineering Agent
 * fase: Runtime Federation → Bounded Agent Loop · data: 2026-09-07 · hora: 00:00
 * antes: Qwen adapter misturava configuração, contrato, chamada HTTP e hash em um único bloco.
 * depois: adapter mantém a execução real e delega contrato/proveniência a módulos tipados, preservando a API invoke.
 * base: feat/gos3-runtime-orchestration
 * assinatura: GPT · Maintainer / Engineering Agent · GOS3
 * commit: registered by Git
 */

import crypto from "node:crypto";
import { computeEvidenceHash, sha256 } from "./provenance";
import { QwenConfig, QwenEvidence } from "./types";

export type { QwenConfig, QwenEvidence } from "./types";

const DEFAULT_BASE_URL = "http://127.0.0.1:11434/v1";
const DEFAULT_MODEL = "qwen2.5-coder:0.5b";
const DEFAULT_TIMEOUT_MS = 30_000;

export async function invoke(prompt: string, config: QwenConfig = {}): Promise<QwenEvidence> {
  const baseUrl = config.baseUrl ?? process.env.QWEN_BASE_URL ?? DEFAULT_BASE_URL;
  const model = config.model ?? process.env.QWEN_MODEL ?? DEFAULT_MODEL;
  const timeoutMs = config.timeoutMs ?? Number(process.env.QWEN_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
  const modelDigest = config.modelDigest ?? process.env.QWEN_MODEL_DIGEST ?? null;
  const runtimeDigest = config.runtimeDigest ?? process.env.QWEN_RUNTIME_DIGEST ?? null;
  const runtimeVersion = config.runtimeVersion ?? process.env.QWEN_RUNTIME_VERSION ?? null;
  const started = Date.now();
  const invocation_id = `inv-${crypto.randomUUID()}`;
  const runtime_id = `qwen-local-${process.pid}`;
  const execution_id = `exec-${crypto.randomUUID()}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0 }),
      signal: controller.signal,
    });
    const body = await response.text();
    if (!response.ok) throw new Error(`Qwen endpoint ${response.status}: ${body}`);
    const parsed: unknown = JSON.parse(body);
    const stdout = String((parsed as { choices?: Array<{ message?: { content?: unknown } }> })?.choices?.[0]?.message?.content ?? body);
    const duration_ms = Date.now() - started;
    const evidence_hash = computeEvidenceHash({
      agent: "Qwen-0.5B",
      model,
      model_digest: modelDigest,
      runtime_version: runtimeVersion,
      runtime_digest: runtimeDigest,
      prompt_hash: sha256(prompt),
      stdout,
      stderr: "",
      execution_id,
      executed: true,
      exit_code: 0,
    });
    return { invocation_id, agent: "Qwen-0.5B", executed: true, runtime_id, execution_id, duration_ms, stdout, stderr: "", exit_code: 0, model, model_digest: modelDigest, runtime_version: runtimeVersion, runtime_digest: runtimeDigest, evidence_hash };
  } catch (error: unknown) {
    const duration_ms = Date.now() - started;
    const stderr = error instanceof Error && error.name === "AbortError" ? `timeout after ${timeoutMs}ms` : error instanceof Error ? error.message : String(error);
    const evidence_hash = computeEvidenceHash({
      agent: "Qwen-0.5B",
      model,
      model_digest: modelDigest,
      runtime_version: runtimeVersion,
      runtime_digest: runtimeDigest,
      prompt_hash: sha256(prompt),
      stdout: "",
      stderr,
      execution_id,
      executed: false,
      exit_code: 1,
    });
    return { invocation_id, agent: "Qwen-0.5B", executed: false, runtime_id, execution_id, duration_ms, stdout: "", stderr, exit_code: 1, model, model_digest: modelDigest, runtime_version: runtimeVersion, runtime_digest: runtimeDigest, evidence_hash };
  } finally {
    clearTimeout(timer);
  }
}
