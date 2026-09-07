// GOS3
// agente: GPT
// papel: Maintainer / Engineering Agent
// fase: Runtime Federation → Ollama Connector
// data: 2026-09-07
// hora: 00:00
// antes: no connector package entry point
// depois: stable Ollama connector export
// base: existing Qwen adapter
// assinatura: agent/llm · Engineering Agent · GOS3
// commit: registered by Git

export { invoke } from "./adapter/index";
export type { OllamaInvokeConfig, OllamaEvidence } from "./adapter/index";
