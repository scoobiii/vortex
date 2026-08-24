import { createHash } from "node:crypto";
import { validateRequest, validateResponse } from "./contract";
import type { GptAdapterConfig, InvocationRequest, InvocationResponse } from "./types";

const DEFAULT_BASE_URL = "https://api.openai.com/v1";

function evidence(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function runtimeId(): string {
  return createHash("sha256").update(`${process.platform}:${process.arch}:${process.version}`).digest("hex").slice(0, 64);
}

export async function invoke(raw: unknown, config: GptAdapterConfig = {}): Promise<InvocationResponse> {
  const start = Date.now();
  try {
    validateRequest(raw);
    const req = raw as InvocationRequest;
    const ctx = req.context ?? {};

    // Zero-trust: dry-run never contacts the external provider.
    if (ctx.dry_run) {
      const response: InvocationResponse = {
        invocation_id: req.invocation_id, agent: "gpt", executed: false,
        result: { dry_run: true, action: req.action }, error: null,
        duration_ms: Date.now() - start, runtime_id: runtimeId(),
      };
      validateResponse(response); return response;
    }

    if (req.action !== "generate") throw new Error(`unsupported action: ${req.action}; supported: generate`);
    const apiKey = config.apiKey ?? process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY not configured; refusing external execution");

    const payload = req.payload ?? {};
    const body = {
      model: String(payload.model ?? config.model ?? process.env.OPENAI_MODEL ?? "gpt-5.6"),
      input: payload.input ?? payload.prompt ?? "",
      ...(payload.instructions ? { instructions: payload.instructions } : {}),
      ...(payload.max_output_tokens ? { max_output_tokens: payload.max_output_tokens } : {}),
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ctx.timeout_ms ?? config.timeoutMs ?? 30_000);
    let responseBody: unknown;
    try {
      const response = await fetch(`${config.baseUrl ?? DEFAULT_BASE_URL}/responses`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(body), signal: controller.signal,
      });
      responseBody = await response.json();
      if (!response.ok) throw new Error(`OpenAI API ${response.status}: ${JSON.stringify(responseBody)}`);
    } finally { clearTimeout(timeout); }

    const response: InvocationResponse = {
      invocation_id: req.invocation_id, agent: "gpt", executed: true,
      result: responseBody, error: null, duration_ms: Date.now() - start,
      evidence_hash: evidence(responseBody), runtime_id: runtimeId(),
    };
    validateResponse(response); return response;
  } catch (err) {
    const response: InvocationResponse = {
      invocation_id: (raw as Partial<InvocationRequest>)?.invocation_id ?? "unknown",
      agent: "gpt", executed: false, result: null,
      error: err instanceof Error ? err.message : String(err), duration_ms: Date.now() - start,
      runtime_id: runtimeId(),
    };
    validateResponse(response); return response;
  }
}
