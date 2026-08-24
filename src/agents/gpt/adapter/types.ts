/**
 * GOS3 · agente: GPT · papel: OpenAI/GPT Runtime Adapter
 * Contrato: spec/invocation-contract.md v0.1
 */

export interface InvocationContext {
  sandbox?: boolean;
  dry_run?: boolean;
  timeout_ms?: number;
  metadata?: Record<string, unknown>;
}

export interface InvocationRequest {
  contract_version?: string;
  invocation_id: string;
  agent: "gpt";
  action: string;
  payload?: Record<string, unknown>;
  context?: InvocationContext;
}

export interface InvocationResponse {
  contract_version?: string;
  invocation_id: string;
  agent: "gpt";
  status?: "success" | "error";
  executed: boolean;
  output?: {
    stdout?: string;
    stderr?: string;
    exit_code?: number | null;
  };
  result?: unknown;
  error?: string | null;
  duration_ms: number;
  truncated?: boolean;
  evidence_hash?: string;
  runtime_id?: string;
}

export interface GptAdapterConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
}
