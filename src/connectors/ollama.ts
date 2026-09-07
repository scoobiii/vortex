/** GOS3 · Vortex · Ollama OpenAI-compatible connector */
import { createHash } from "node:crypto";
import { ConnectorRequest, ConnectorResponse, connector } from "./connector";

export interface OllamaRequest extends ConnectorRequest {
  input: { model: string; messages: Array<{ role: string; content: string }>; temperature?: number; maxTokens?: number };
}

export const ollamaConnector = connector<OllamaRequest, string>({
  id: "ollama-openai-compatible",
  kind: "model",
  async invoke(request) {
    const baseUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434/v1";
    let response: Response;
    try {
      response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: request.input.model,
          messages: request.input.messages,
          stream: false,
          temperature: request.input.temperature ?? 0,
          max_tokens: request.input.maxTokens ?? 512,
        }),
        signal: AbortSignal.timeout(request.context?.timeoutMs ?? 30_000),
      });
    } catch (error) {
      return { ok: false, error: `Ollama unavailable: ${error instanceof Error ? error.message : String(error)}` };
    }
    if (!response.ok) return { ok: false, error: `Ollama HTTP ${response.status}` };
    const body = await response.json() as any;
    const output = body.choices?.[0]?.message?.content ?? "";
    const evidenceHash = createHash("sha256")
      .update(JSON.stringify({ id: body.id, model: body.model || request.input.model, output, usage: body.usage }))
      .digest("hex");
    return {
      ok: true,
      output,
      providerUsed: "ollama",
      modelUsed: body.model || request.input.model,
      evidenceHash,
      metadata: { id: body.id, usage: body.usage },
    };
  },
});
