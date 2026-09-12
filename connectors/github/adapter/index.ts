// GOS3
// agente: GPT
// papel: Maintainer / Engineering Agent
// fase: Connector Federation → GitHub Adapter
// data: 2026-09-07
// hora: 00:00
// antes: GitHub capability existed without a repository-local connector boundary
// depois: explicit GitHub connector contract over existing gateway concepts
// base: src/gateway connector/proof contract
// assinatura: agent/llm · Engineering Agent · GOS3
// commit: registered by Git

export interface GitHubInvokeRequest { request_id: string; connector_id: "github"; operation: string; input?: unknown; credential_id?: string; timeout_ms?: number; metadata?: Record<string, string>; }
export interface GitHubExecutionProof { proof_version: "1"; request_id: string; connector_id: "github"; executed: boolean; status: "success" | "error" | "timeout"; input_hash: string; output_hash: string; started_at: string; completed_at: string; duration_ms: number; runtime_id: string; credential_id?: string; }
