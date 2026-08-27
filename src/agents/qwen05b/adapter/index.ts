// **GOS3** · agente: `Qwen-0.5B` · papel: bounded local worker
import crypto from "node:crypto";

export interface QwenConfig { baseUrl?: string; model?: string; timeoutMs?: number; }
export interface QwenEvidence {
  invocation_id: string;
  agent: "Qwen-0.5B";
  executed: boolean;
  runtime_id: string;
  execution_id: string;
  duration_ms: number;
  stdout: string;
  stderr: string;
  exit_code: number;
  evidence_hash: string;
}

export async function invoke(prompt: string, config: QwenConfig = {}): Promise<QwenEvidence> {
  const baseUrl = config.baseUrl ?? process.env.QWEN_BASE_URL ?? "http://127.0.0.1:11434/v1";
  const model = config.model ?? process.env.QWEN_MODEL ?? "qwen2.5-coder:0.5b";
  const timeoutMs = config.timeoutMs ?? 30_000;
  const started = Date.now();
  const invocation_id = `inv-${crypto.randomUUID()}`;
  const runtime_id = `qwen-local-${process.pid}`;
  const execution_id = `exec-${crypto.randomUUID()}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0 }),
      signal: controller.signal,
    });
    const body = await response.text();
    if (!response.ok) throw new Error(`Qwen endpoint ${response.status}: ${body}`);
    const parsed = JSON.parse(body);
    const stdout = String(parsed?.choices?.[0]?.message?.content ?? body);
    const duration_ms = Date.now() - started;
    const evidence_hash = crypto.createHash("sha256").update(JSON.stringify({ model, prompt, stdout, execution_id })).digest("hex");
    return { invocation_id, agent: "Qwen-0.5B", executed: true, runtime_id, execution_id, duration_ms, stdout, stderr: "", exit_code: 0, evidence_hash };
  } catch (error: any) {
    const duration_ms = Date.now() - started;
    const stderr = error?.name === "AbortError" ? `timeout after ${timeoutMs}ms` : String(error?.message ?? error);
    const evidence_hash = crypto.createHash("sha256").update(JSON.stringify({ model, prompt, stderr, execution_id })).digest("hex");
    return { invocation_id, agent: "Qwen-0.5B", executed: false, runtime_id, execution_id, duration_ms, stdout: "", stderr, exit_code: 1, evidence_hash };
  } finally { clearTimeout(timer); }
}
