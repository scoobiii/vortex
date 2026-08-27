/** GOS3 · Vortex · Ollama OpenAI-compatible connector */
import { ConnectorRequest, ConnectorResponse, connector } from "./connector";

export interface OllamaRequest extends ConnectorRequest {
  input: { model: string; messages: Array<{ role: string; content: string }>; temperature?: number; maxTokens?: number };
}

export const ollamaConnector = connector<OllamaRequest, string>({
  id: "ollama-openai-compatible",
  kind: "model",
  async invoke(request) {
    const baseUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434/v1";
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
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
    if (!response.ok) return { ok: false, error: `Ollama HTTP ${response.status}` };
    const body = await response.json() as any;
    return {
      ok: true,
      output: body.choices?.[0]?.message?.content ?? "",
      providerUsed: "ollama",
      modelUsed: body.model || request.input.model,
      metadata: { id: body.id, usage: body.usage },
    };
  },
});
