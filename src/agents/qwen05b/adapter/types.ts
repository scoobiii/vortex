/**
 * GOS3 · agente: GPT · papel: Maintainer / Engineering Agent
 * fase: Runtime Federation → Qwen Provenance · data: 2026-09-07 · hora: 00:00
 * antes: Qwen adapter retornava evidência sem identidade verificável do artefato de modelo/runtime.
 * depois: contrato tipado inclui digest do modelo/runtime e hash de execução derivado de evidência canônica.
 * base: feat/gos3-runtime-orchestration
 * assinatura: GPT · Maintainer / Engineering Agent · GOS3
 * commit: registered by Git
 */

export interface QwenConfig {
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
  modelDigest?: string;
  runtimeDigest?: string;
  runtimeVersion?: string;
}

export interface QwenEvidence {
  invocation_id: string;
  agent: "Qwen-0.5B";
  executed: boolean;
  runtime_id: string;
  execution_id: string;
  duration_ms: number;
  stdout: string;
  stderr: string;
  exit_code: number;
  model: string;
  model_digest: string | null;
  runtime_version: string | null;
  runtime_digest: string | null;
  evidence_hash: string;
}
