// GOS3
// agente: GPT
// papel: Maintainer / Engineering Agent
// fase: Runtime Federation → Ollama Provenance
// data: 2026-09-07
// hora: 00:00
// antes: provenance implementation coupled to Qwen adapter
// depois: reusable Ollama provenance exports
// base: existing Qwen SHA-256 provenance implementation
// assinatura: agent/llm · Engineering Agent · GOS3
// commit: registered by Git

export { sha256, canonicalizeProvenance, computeEvidenceHash } from "../../../src/agents/qwen05b/adapter/provenance";
export type { QwenProvenanceInput } from "../../../src/agents/qwen05b/adapter/provenance";
