/**
 * GOS3 · Vortex Universal Connector Gateway
 * Production MVP contracts.
 */

export type ConnectorKind = "local" | "remote";
export type ConnectorStatus = "healthy" | "degraded" | "unavailable";

export interface InvokeRequest {
  request_id: string;
  connector_id: string;
  operation: string;
  input?: unknown;
  credential_id?: string;
  timeout_ms?: number;
  metadata?: Record<string, string>;
}

export interface ExecutionProof {
  proof_version: "1";
  request_id: string;
  connector_id: string;
  executed: boolean;
  status: "success" | "error" | "timeout";
  input_hash: string;
  output_hash: string;
  started_at: string;
  completed_at: string;
  duration_ms: number;
  runtime_id: string;
  credential_id?: string;
}

export interface InvokeResponse {
  request_id: string;
  connector_id: string;
  status: "success" | "error" | "timeout";
  executed: boolean;
  output?: unknown;
  error?: { code: string; message: string };
  proof: ExecutionProof;
}

export interface ConnectorManifest {
  id: string;
  name: string;
  version: string;
  kind: ConnectorKind;
  operations: string[];
  credential_type: "none" | "bearer_env";
  description: string;
}

export interface ConnectorContext {
  requestId: string;
  timeoutMs: number;
  credential?: string;
}

export interface Connector {
  manifest(): ConnectorManifest;
  health(): Promise<ConnectorStatus>;
  invoke(operation: string, input: unknown, context: ConnectorContext): Promise<unknown>;
}

export interface CredentialLease {
  credentialId: string;
  value: string;
  expiresAt: number;
}

export interface CredentialBroker {
  issue(credentialId: string | undefined, connectorId: string): CredentialLease | undefined;
}
