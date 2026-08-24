/**
 * GOS3 · agente: GPT · papel: OpenAI Runtime Adapter
 * fase: Sprint GPT-Connector · data: 2026-08-24
 * base: Vortex invocation contract v0.1
 * assinatura: GPT · GOS3
 */

import { createHash } from "node:crypto";
import type { GPTInvocationRequest, GPTInvocationResponse } from "./types";

const DEFAULT_MODEL = "gpt-5";

function runtimeId(): string {
  const raw = [process.platform, process.arch, process.version].join(":");
  return createHash("sha256").update(raw).digest("hex");
}

function evidence(response: Omit<GPTInvocationResponse, "evidence_hash">): string {
  return createHash("sha256")
    .update(JSON.stringify(response))
    .digest("hex");
}

export async function invoke(raw: unknown): Promise<GPTInvocationResponse> {
  const started = Date.now();

  if (!raw || typeof raw !== "object") {
    return failure("invalid_request", "Request must be an object", started);
  }

  const req = raw as GPTInvocationRequest;
  if (req.agent !== "gpt" || req.action !== "generate") {
    return failure("invalid_request", 'Expected agent="gpt" and action="generate"', started, req.invocation_id);
  }

  const ctx = req.context ?? {};
  const invocationId = req.invocation_id;
  const rid = runtimeId();

  if (ctx.dry_run) {
    const base: GPTInvocationResponse = {
      invocation_id: invocationId,
      agent: "gpt",
      status: "not_executed",
      executed: false,
      result: { mode: "dry_run", model: req.payload.model ?? ctx.model ?? DEFAULT_MODEL },
      error: null,
      duration_ms: Date.now() - started,
      runtime_id: rid,
    };
    return { ...base, evidence_hash: evidence(base) };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const base: GPTInvocationResponse = {
      invocation_id: invocationId,
      agent: "gpt",
      status: "not_executed",
      executed: false,
      result: null,
      error: "OPENAI_API_KEY is not configured; external inference was not executed",
      duration_ms: Date.now() - started,
      runtime_id: rid,
    };
    return { ...base, evidence_hash: evidence(base) };
  }

  try {
    const body = {
      model: req.payload.model ?? ctx.model ?? DEFAULT_MODEL,
      input: req.payload.input,
      ...(req.payload.instructions ? { instructions: req.payload.instructions } : {}),
    };

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(ctx.timeout_ms ?? 30_000),
    });

    const payload = await res.json() as Record<string, unknown>;
    const base: GPTInvocationResponse = {
      invocation_id: invocationId,
      agent: "gpt",
      status: res.ok ? "success" : "error",
      executed: true,
      result: res.ok ? payload : null,
      error: res.ok ? null : `OpenAI HTTP ${res.status}`,
      duration_ms: Date.now() - started,
      runtime_id: rid,
    };
    return { ...base, evidence_hash: evidence(base) };
  } catch (err) {
    const base: GPTInvocationResponse = {
      invocation_id: invocationId,
      agent: "gpt",
      status: "error",
      executed: false,
      result: null,
      error: err instanceof Error ? err.message : String(err),
      duration_ms: Date.now() - started,
      runtime_id: rid,
    };
    return { ...base, evidence_hash: evidence(base) };
  }
}

function failure(
  status: "invalid_request" | "not_executed",
  message: string,
  started: number,
  invocationId = "unknown"
): GPTInvocationResponse {
  const base: GPTInvocationResponse = {
    invocation_id: invocationId,
    agent: "gpt",
    status: status === "invalid_request" ? "error" : "not_executed",
    executed: false,
    result: null,
    error: message,
    duration_ms: Date.now() - started,
    runtime_id: runtimeId(),
  };
  return { ...base, evidence_hash: evidence(base) };
}
