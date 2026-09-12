// GOS3
// agente: GPT
// papel: Maintainer / Engineering Agent — VUA P&D
// fase: Runtime Federation → VUA Contract
// data: 2026-09-07
// hora: 16:22
// antes: VUA estava apenas registrada como diretório/documentação
// depois: contrato tipado executável para P&D, sem dependência do runtime Qwen
// base: VUA v1 experimental
// assinatura: agent/llm · Engineering Agent · GOS3
// commit: registered by Git
export type VuaProtocolVersion = 'vua/v1';
export type AdapterStatus = 'active' | 'experimental' | 'deprecated';
export interface AdapterIdentity { id: string; name: string; version: string; status: AdapterStatus; environments?: readonly string[]; }
export interface Capability { id: string; description: string; destructive: boolean; offline: boolean; }
export interface ExecutionRequest<TProposal = unknown> { requestId: string; protocol: VuaProtocolVersion; adapterId: string; proposal: TProposal; requestedCapabilities: string[]; context?: Record<string, unknown>; }
export interface ExecutionEvidence { kind: string; value: unknown; }
export interface ExecutionResult { requestId: string; success: boolean; startedAt: string; finishedAt: string; evidence: ExecutionEvidence[]; metrics?: Record<string, number>; error?: { code: string; message: string }; }
export interface ExecutionProof { protocol: VuaProtocolVersion; request: ExecutionRequest; result: ExecutionResult; repositoryStateHash?: string; changeHash?: string; proofHash: string; }
export interface ValidationResult { valid: boolean; errors: string[]; warnings: string[]; }
export interface UniversalAdapter<TProposal = unknown> { readonly identity: AdapterIdentity; capabilities(): readonly Capability[]; validate(request: ExecutionRequest<TProposal>): ValidationResult; execute(request: ExecutionRequest<TProposal>): Promise<ExecutionResult>; }
