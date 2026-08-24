import type { InvocationRequest, InvocationResponse } from "./types";

export function validateRequest(value: unknown): asserts value is InvocationRequest {
  if (!value || typeof value !== "object") throw new Error("request must be an object");
  const r = value as Record<string, unknown>;
  for (const key of ["invocation_id", "agent", "action"]) {
    if (typeof r[key] !== "string" || !r[key]) throw new Error(`missing/invalid ${key}`);
  }
  if (r.agent !== "gpt") throw new Error('agent must be "gpt"');
}

export function validateResponse(value: unknown): asserts value is InvocationResponse {
  if (!value || typeof value !== "object") throw new Error("response must be an object");
  const r = value as Record<string, unknown>;
  if (typeof r.invocation_id !== "string") throw new Error("invalid invocation_id");
  if (r.agent !== "gpt") throw new Error('agent must be "gpt"');
  if (typeof r.executed !== "boolean") throw new Error("executed must be boolean");
  if (typeof r.duration_ms !== "number") throw new Error("duration_ms must be number");
}
