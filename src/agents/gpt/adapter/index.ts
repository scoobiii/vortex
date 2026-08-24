/**
 * GOS3 · agente: GPT / OpenAI Adapter
 * papel: Server-side Runtime Connector
 * fase: Credential Boundary / Zero-Trust
 * regra: OPENAI_API_KEY permanece exclusivamente no runtime host
 */

import { createHash } from "node:crypto";

export interface GptInvocationRequest {
  invocation_id: string;
  agent: "gpt";
  task: string;
  model?: string;
  context?: Record<string, unknown>;
}

export interface GptInvocationResponse {
  invocation_id: string;
  agent: "gpt";
  executed: boolean;
  claim?: "not_executed";
  status: "success" | "error" | "not_executed";
  model?: string;
  output?: string;
  error?: string;
  duration_ms: number;
  evidence_hash?: string;
  runtime_id?: string;
}

interface OpenAIResponse {
  id?: string;
  model?: string;
  output_text?: string;
  output?: unknown;
  error?: { message?: string };
}

export interface GptAdapterDeps {
  fetchImpl?: typeof fetch;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  runtimeId?: string;
}

function sha256(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex");
}

function getOutputText(body: OpenAIResponse): string {
  if (typeof body.output_text === "string") return body.output_text;

  if (Array.isArray(body.output)) {
    return body.output
      .flatMap((item: any) => Array.isArray(item?.content) ? item.content : [])
      .filter((item: any) => item?.type === "output_text" && typeof item?.text === "string")
      .map((item: any) => item.text)
      .join("\n");
  }

  return "";
}

/**
 * Executes GPT server-side. The API key is read from process.env only by default
 * and is never included in request/response envelopes, logs or evidence.
 */
export async function invoke(
  raw: unknown,
  deps: GptAdapterDeps = {},
): Promise<GptInvocationResponse> {
  const started = Date.now();
  const request = raw as Partial<GptInvocationRequest>;
  const invocationId = typeof request?.invocation_id === "string"
    ? request.invocation_id
    : "unknown";

  const apiKey = deps.apiKey ?? process.env.OPENAI_API_KEY;
  const model = deps.model ?? request?.model ?? process.env.OPENAI_MODEL ?? "gpt-5.6";
  const runtimeId = deps.runtimeId ?? process.env.VORTEX_RUNTIME_ID;

  if (!apiKey) {
    return {
      invocation_id: invocationId,
      agent: "gpt",
      executed: false,
      claim: "not_executed",
      status: "not_executed",
      error: "OPENAI_API_KEY não configurada no runtime host",
      duration_ms: Date.now() - started,
      ...(runtimeId ? { runtime_id: runtimeId } : {}),
    };
  }

  if (request?.agent !== "gpt" || typeof request?.task !== "string" || !request.task.trim()) {
    return {
      invocation_id: invocationId,
      agent: "gpt",
      executed: false,
      status: "error",
      error: "Request inválido: agent=\"gpt\" e task não vazia são obrigatórios",
      duration_ms: Date.now() - started,
      ...(runtimeId ? { runtime_id: runtimeId } : {}),
    };
  }

  const fetchImpl = deps.fetchImpl ?? fetch;
  const baseUrl = (deps.baseUrl ?? process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");

  try {
    const response = await fetchImpl(`${baseUrl}/responses`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, input: request.task }),
    });

    const body = await response.json() as OpenAIResponse;
    const durationMs = Date.now() - started;
    const output = response.ok ? getOutputText(body) : undefined;
    const evidence = {
      invocation_id: invocationId,
      agent: "gpt",
      status: response.ok ? "success" : "error",
      http_status: response.status,
      model: body.model ?? model,
      response_id: body.id ?? null,
      output: output ?? null,
      error: response.ok ? null : body.error?.message ?? `OpenAI HTTP ${response.status}`,
      duration_ms: durationMs,
      runtime_id: runtimeId ?? null,
    };

    return {
      invocation_id: invocationId,
      agent: "gpt",
      executed: response.ok,
      status: response.ok ? "success" : "error",
      model: body.model ?? model,
      ...(output !== undefined ? { output } : {}),
      ...(!response.ok ? { error: body.error?.message ?? `OpenAI HTTP ${response.status}` } : {}),
      duration_ms: durationMs,
      evidence_hash: sha256(evidence),
      ...(runtimeId ? { runtime_id: runtimeId } : {}),
    };
  } catch (err) {
    return {
      invocation_id: invocationId,
      agent: "gpt",
      executed: false,
      status: "error",
      error: err instanceof Error ? err.message : String(err),
      duration_ms: Date.now() - started,
      ...(runtimeId ? { runtime_id: runtimeId } : {}),
    };
  }
}
