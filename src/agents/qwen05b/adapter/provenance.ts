/**
 * GOS3 · agente: GPT · papel: Maintainer / Engineering Agent
 * fase: Runtime Federation → Qwen Provenance · data: 2026-09-07 · hora: 00:00
 * antes: hash de evidência dependia apenas de campos montados inline no adapter.
 * depois: canonicalização explícita produz hash estável da proveniência observada, incluindo modelo e runtime.
 * base: feat/gos3-runtime-orchestration
 * assinatura: GPT · Maintainer / Engineering Agent · GOS3
 * commit: registered by Git
 */

import crypto from "node:crypto";

export interface QwenProvenanceInput {
  agent: "Qwen-0.5B";
  model: string;
  model_digest: string | null;
  runtime_version: string | null;
  runtime_digest: string | null;
  prompt_hash: string;
  stdout: string;
  stderr: string;
  execution_id: string;
  executed: boolean;
  exit_code: number;
}

export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function canonicalizeProvenance(input: QwenProvenanceInput): string {
  return JSON.stringify({
    agent: input.agent,
    model: input.model,
    model_digest: input.model_digest,
    runtime_version: input.runtime_version,
    runtime_digest: input.runtime_digest,
    prompt_hash: input.prompt_hash,
    stdout: input.stdout,
    stderr: input.stderr,
    execution_id: input.execution_id,
    executed: input.executed,
    exit_code: input.exit_code,
  });
}

export function computeEvidenceHash(input: QwenProvenanceInput): string {
  return sha256(canonicalizeProvenance(input));
}
