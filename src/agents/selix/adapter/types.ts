/**
 * GOS3 · agente: selix · papel: Economic Runtime Adapter
 * ação: selix.selic1d · contrato: invocation-contract v0.1 + evidence
 */

export interface InvocationContext {
  sandbox?: boolean;
  timeout_ms?: number;
  dry_run?: boolean;
  [key: string]: unknown;
}

export interface SelixRequest {
  invocation_id: string;
  agent: "selix";
  action: "selix.selic1d";
  payload: {
    selic_atual: number;
    selic_ideal: number;
    ipca: number;
    [key: string]: unknown;
  };
  context?: InvocationContext;
}

export interface SelixResult {
  selic_atual: number;
  selic_ideal: number;
  diferencial_pp: number;
  ipca_proxy: number;
  juro_real_atual: number;
  juro_real_1d: number;
  reducao_juro_real_pp: number;
}

export interface SelixResponse {
  invocation_id: string;
  agent: "selix";
  action: "selix.selic1d";
  gate: "PASS" | "FAIL";
  claim: "executed" | "not_executed";
  executed: boolean;
  result: SelixResult | null;
  evidence: {
    input_hash: string;
    output_hash: string;
    timestamp: string;
    exit_code: number;
    duration_ms: number;
  } | null;
  logs: string[];
  error: string | null;
}
