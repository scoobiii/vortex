// GOS3
// agente: GPT
// papel: Maintainer / Engineering Agent
// fase: Runtime Federation → Ollama Connector
// data: 2026-09-07
// hora: 00:00
// antes: Ollama runtime lived implicitly behind the Qwen adapter
// depois: explicit connector boundary while preserving Qwen runtime behavior
// base: existing Qwen OpenAI-compatible adapter
// assinatura: agent/llm · Engineering Agent · GOS3
// commit: registered by Git

import { invoke as invokeQwen, type QwenConfig, type QwenEvidence } from "../../../src/agents/qwen05b/adapter/index";
export type OllamaInvokeConfig = QwenConfig;
export type OllamaEvidence = QwenEvidence;
export async function invoke(prompt: string, config: OllamaInvokeConfig = {}): Promise<OllamaEvidence> { return invokeQwen(prompt, config); }
