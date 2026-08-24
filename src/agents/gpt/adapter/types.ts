/**
 * GOS3 · agente: GPT · papel: OpenAI Runtime Adapter
 * fase: Sprint GPT-Connector · data: 2026-08-24
 * base: Vortex invocation contract v0.1
 * assinatura: GPT · GOS3
 */

export interface GPTContext {
  sandbox?: boolean;
  timeout_ms?: number;
  dry_run?: boolean;
  model?: string;
  [key: string]: unknown;
}

export interface GPTInvocationRequest {
  invocation_id: string;
  agent: "gpt";
  action: "generate";
  payload: {
    input: string | unknown[];
    model?: string;
    instructions?: string;
    [key: string]: unknown;
  };
  context?: GPTContext;
}

export interface GPTInvocationResponse {
  invocation_id: string;
  agent: "gpt";
  status: "success" | "error" | "not_executed";
  executed: boolean;
  result: Record<string, unknown> | null;
  error: string | null;
  duration_ms: number;
  runtime_id?: string;
  evidence_hash?: string;
}
