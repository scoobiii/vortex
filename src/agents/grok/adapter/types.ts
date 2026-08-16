/**
 * GOS3 · agente: scoobiii · papel: Dev / Grok Adapter
 * fase: Sprint 2 - Governance Retroativo · data: 2026-08-16
 * base: 88c1ab4 · assinatura: scoobiii · PO · GOS3
 */
/**
 * invocation-contract.md v0.1 — tipos de referência
 * Runtime Reference Agent (Grok)
 */

export interface InvocationContext {
  sandbox?: boolean;
  timeout_ms?: number;
  dry_run?: boolean;
  [key: string]: unknown;
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
  /** Obrigatório pelo contrato v0.1 */
  executed: boolean;
  result: Record<string, unknown> | null;
  error: string | null;
  logs: string[];
  duration_ms: number;
}

export type ActionHandler = (
  payload: Record<string, unknown>,
  ctx: InvocationContext
) => Promise<{ result: Record<string, unknown>; logs: string[] }>;
