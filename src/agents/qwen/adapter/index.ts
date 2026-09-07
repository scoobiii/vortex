/**
 * GOS3 · agente: qwen · papel: Agent Adapter / Ollama
 * fase: Qwen connector reorganization · data: 2026-09-06
 * base: a9083f0 · assinatura: GPT · Engineering Agent · GOS3
 */

import { validateRequest, validateResponse } from "./contract";
import { invokeQwen } from "./handler";
import { InvocationRequest, InvocationResponse, QwenConfig } from "./types";

export async function invoke(raw: unknown, config: QwenConfig = {}): Promise<InvocationResponse> {
  const start = Date.now();
  const logs: string[] = [];
  try {
    validateRequest(raw);
    const req = raw as InvocationRequest;
    const endpoint = config.endpoint ?? "http://localhost:11434";
    const model = config.model ?? "qwen2.5-coder:0.5b";
    const ctx = { sandbox: true, timeout_ms: config.timeout_ms ?? 30_000, ...req.context };

    if (req.action !== "generate") {
      throw new Error(`Ação desconhecida: "${req.action}". Use action="generate".`);
    }

    logs.push(`[qwen] invocation_id=${req.invocation_id}`);
    logs.push(`[qwen] provider=ollama model=${model}`);

    const prompt = typeof req.payload.prompt === "string" ? req.payload.prompt : null;
    if (!prompt) throw new Error("payload.prompt é obrigatório para action=generate");

    const result = await invokeQwen(endpoint, model, prompt, ctx);
    const executed = !ctx.dry_run && result.telemetry.done === true && (result.telemetry.eval_count ?? 0) > 0 && (result.telemetry.eval_duration ?? 0) > 0;
    logs.push(`[qwen] ollama_done=${result.telemetry.done}`);
    logs.push(`[qwen] eval_count=${result.telemetry.eval_count ?? 0}`);
    logs.push(`[qwen] eval_duration_ns=${result.telemetry.eval_duration ?? 0}`);

    const response: InvocationResponse = {
      invocation_id: req.invocation_id,
      agent: "qwen",
      executed,
      result: {
        output: result.output,
        telemetry: result.telemetry,
        model,
        provider: "ollama",
      },
      error: null,
      logs,
      duration_ms: Date.now() - start,
    };
    validateResponse(response);
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logs.push(`[qwen] error: ${message}`);
    const response: InvocationResponse = {
      invocation_id: (raw as any)?.invocation_id ?? "unknown",
      agent: "qwen",
      executed: false,
      result: null,
      error: message,
      logs,
      duration_ms: Date.now() - start,
    };
    validateResponse(response);
    return response;
  }
}

export { validateRequest, validateResponse } from "./contract";
export type { InvocationRequest, InvocationResponse, QwenConfig } from "./types";
