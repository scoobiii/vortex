// GOS3 · Vortex Foundation conformance artifact
/**
 * Vortex Gateway — core contract types.
 *
 * These mirror the normative contract in spec/invocation.md and
 * spec/execution-proof.md. The Gateway does not invent a parallel
 * contract: this is the same InvokeRequest / ExecutionProof shape
 * agreed as the Gateway Specification v1 baseline.
 */

/** Caller-supplied request to invoke a connector operation. */
export interface InvokeRequest {
  request_id: string;
  connector_id: string;
  operation: string;
  input: unknown;
  credential_id?: string;
  timeout_ms?: number;
  metadata?: Record<string, unknown>;
}

/** Gateway execution status. Never "probably ok" — always one of these. */
export type ExecutionStatus =
  | "OK"
  | "ERROR"
  | "TIMEOUT"
  | "UNAUTHENTICATED"
  | "INVALID_REQUEST"
  | "UNKNOWN_CONNECTOR"
  | "UNKNOWN_OPERATION"
  | "CREDENTIAL_DENIED"
  | "REPLAY_DENIED";

/**
 * Observable, hash-committed record of what the Gateway did.
 * Produced for every request — including requests that never reached
 * execution (auth/validation/credential/replay failures) — with executed=false
 * in those cases. A proof is always produced; it is never optional.
 */
export interface ExecutionProof {
  proof_version: "vortex-gateway/1";
  request_id: string;
  connector_id: string;
  operation: string;
  executed: boolean;
  status: ExecutionStatus;
  input_hash: string;
  output_hash: string | null;
  started_at: string;
  completed_at: string;
  duration_ms: number;
  runtime_id: string;
  credential_id: string | null;
  /** Self-referential hash over the canonical proof body (tamper evidence). */
  proof_hash: string;
}

export interface InvokeResult {
  ok: boolean;
  output: unknown | null;
  proof: ExecutionProof;
}

/** Raised for every rejection path. Always carries a status + a proof. */
export class GatewayError extends Error {
  readonly status: ExecutionStatus;
  readonly proof: ExecutionProof;
  constructor(status: ExecutionStatus, message: string, proof: ExecutionProof) {
    super(message);
    this.name = "GatewayError";
    this.status = status;
    this.proof = proof;
  }
}

/**
 * Connector contract. A connector never sees the raw credential secret
 * unless the Gateway's CredentialBroker explicitly injects it into ctx —
 * and even then, the connector MUST NOT echo it back in its output. The
 * Gateway does not verify that a connector honors this; that is why
 * connectors are reference-audited, not "trusted by construction".
 */
export interface ConnectorContext {
  request_id: string;
  operation: string;
  /** Opaque credential material scoped to this single call. Never logged, never proofed. */
  credential?: unknown;
  signal: AbortSignal;
}

export interface VortexConnector {
  readonly id: string;
  readonly operations: readonly string[];
  invoke(input: unknown, ctx: ConnectorContext): Promise<unknown>;
}

/** A credential's grant: which connector+operation pairs it authorizes. */
export interface CredentialGrant {
  id: string;
  secret?: unknown;
  scope: Array<{ connector_id: string; operations: readonly string[] }>;
}

/** Result of authenticating the caller of the Gateway itself (not the LLM's identity — that is MCP's job). */
export interface AuthContext {
  authenticated: boolean;
  caller_id?: string;
}

export interface Authenticator {
  authenticate(token: string | undefined): AuthContext;
}
