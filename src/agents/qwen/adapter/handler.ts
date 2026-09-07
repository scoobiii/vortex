/**
 * GOS3 · agente: qwen · papel: Agent Adapter / Ollama
 * fase: Qwen connector reorganization · data: 2026-09-06
 * base: a9083f0 · assinatura: GPT · Engineering Agent · GOS3
 */

import { InvocationContext, QwenTelemetry } from "./types";

export type OllamaGenerate = {
  model: string;
  prompt: string;
  stream: false;
  done: boolean;
  done_reason?: string;
  response?: string;
  prompt_eval_count?: number;
  eval_count?: number;
  eval_duration?: number;
  total_duration?: number;
};

export async function invokeQwen(
  endpoint: string,
  model: string,
  prompt: string,
  ctx: InvocationContext
): Promise<{ output: string; telemetry: QwenTelemetry }> {
  if (ctx.dry_run) {
    return { output: "", telemetry: { done: false } };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number(ctx.timeout_ms ?? 30_000));
  try {
    const response = await fetch(`${endpoint.replace(/\\/$/, "")}/api/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model, prompt, stream: false }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
    const data = (await response.json()) as OllamaGenerate;
    if (!data.done) throw new Error("Ollama não confirmou done=true");
    return {
      output: data.response ?? "",
      telemetry: {
        done: data.done,
        done_reason: data.done_reason,
        prompt_eval_count: data.prompt_eval_count,
        eval_count: data.eval_count,
        eval_duration: data.eval_duration,
        total_duration: data.total_duration,
      },
    };
  } finally {
    clearTimeout(timer);
  }
}
