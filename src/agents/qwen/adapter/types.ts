/**
 * GOS3 · agente: qwen · papel: Agent Adapter / Ollama
 * fase: Qwen connector reorganization · data: 2026-09-06
 * base: a9083f0 · assinatura: GPT · Engineering Agent · GOS3
 */

export interface InvocationContext {
  sandbox?: boolean;
  timeout_ms?: number;
  dry_run?: boolean;
  [key: string]: unknown;
}

export interface InvocationRequest {
  invocation_id: string;
  agent: string;
  action: string;
  payload: Record<string, unknown>;
  context?: InvocationContext;
}

export interface QwenTelemetry {
  done: boolean;
  done_reason?: string;
  prompt_eval_count?: number;
  eval_count?: number;
  eval_duration?: number;
  total_duration?: number;
}

export interface InvocationResponse {
  invocation_id: string;
  agent: string;
  executed: boolean;
  result: Record<string, unknown> | null;
  error: string | null;
  logs: string[];
  duration_ms: number;
}

export type QwenConfig = {
  endpoint?: string;
  model?: string;
  timeout_ms?: number;
};
