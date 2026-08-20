/**
 * GOS3 · agente: Claude · papel: Arquiteto / Tech Writer (ver docs/team.md)
 * fase: Technical Refinement (E2) · data: 2026-08-17 · hora: 22:40:00 -03:00
 * antes: src/agents/claude/ não existia — Claude só tinha specs/decisões, sem adapter
 * depois: primeiro adapter Claude implementado, mesmo shape do Grok (specs/invocation-contract.md v0.1)
 * base: commit 75973a3
 * assinatura: Claude · Arquiteto / Tech Writer · GOS3
 */
/**
 * invocation-contract.md v0.1 — tipos de referência
 * Proposer Agent (Claude) — Arquiteto / Tech Writer
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
