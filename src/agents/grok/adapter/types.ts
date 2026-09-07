/**
 * GOS3 · agente: GPT · papel: Engineering Agent / Grok Adapter
 * fase: Sprint Proof-of-Execution · data: 2026-09-06
 * assinatura: GPT · GOS3
 */

export interface InvocationContext {
  sandbox?: boolean;
  timeout_ms?: number;
  dry_run?: boolean;
  [key: string]: unknown;
}

export interface EffectObservation {
  observed: boolean;
  kind: string;
  fingerprint: string;
}

export interface ExecutionReceipt {
  invocation_id: string;
  agent: string;
  action: string;
  started_at: string;
  finished_at: string;
  duration_ms: number;
  exit_code: number;
  effect_observed: boolean;
  effect_kind: string;
  effect_fingerprint: string;
}

export interface InvocationRequest {
  invocation_id: string;
  agent: string;
  action: string;
  payload: Record<string, unknown>;
  context?: InvocationContext;
}

export interface InvocationResponse {
  invocation_id: string;
  agent: string;
  executed: boolean;
  result: Record<string, unknown> | null;
  error: string | null;
  logs: string[];
  duration_ms: number;
  receipt: ExecutionReceipt | null;
  evidence_hash: string | null;
}

export type ActionHandlerResult = {
  result: Record<string, unknown>;
  logs: string[];
  effect?: EffectObservation;
};

export type ActionHandler = (
  payload: Record<string, unknown>,
  ctx: InvocationContext
) => Promise<ActionHandlerResult>;
