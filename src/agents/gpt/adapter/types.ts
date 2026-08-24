// **GOS3** · agente: GPT · papel: Adapter
// Evidence rule: adapter cannot manufacture execution proof.

export type ExecutionStatus = "success" | "error" | "partial" | "timeout";

export interface InvocationContext {
  sandbox: boolean;
  timeout_ms: number;
  dry_run?: boolean;
  runtime_id?: string;
  capabilities?: string[];
  [key: string]: unknown;
}

export interface InvocationRequest {
  contract_version: "0.1";
  invocation_id: string;
  agent: "gpt";
  action: string;
  payload: Record<string, unknown>;
  context?: Partial<InvocationContext>;
}

export interface RuntimeObservation {
  runtime_id: string;
  execution_id: string;
  recorded_at: string;
  stdout: string;
  stderr: string;
  exit_code: number;
  duration_ms: number;
  truncated: boolean;
  evidence_hash: string;
}

export interface InvocationResponse {
  contract_version: "0.1";
  invocation_id: string;
  agent: "gpt";
  status: ExecutionStatus;
  executed: boolean;
  output: {
    stdout: string;
    stderr: string;
    exit_code: number;
  };
  duration_ms: number;
  truncated: boolean;
  evidence_hash?: string;
  runtime?: RuntimeObservation;
  error?: string;
}

export interface RuntimeExecutor {
  execute(
    request: InvocationRequest,
    context: InvocationContext,
  ): Promise<RuntimeObservation>;
}
