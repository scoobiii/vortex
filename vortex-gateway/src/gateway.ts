import { randomUUID } from "node:crypto";
import type {
  Authenticator,
  ExecutionProof,
  ExecutionStatus,
  InvokeRequest,
  InvokeResult,
} from "./types.js";
import { GatewayError } from "./types.js";
import { validateInvokeRequest } from "./validate.js";
import { ConnectorRegistry, UnknownOperationError } from "./connector-registry.js";
import { CredentialBroker } from "./credential-broker.js";
import { executeWithTimeout, ExecutionTimeoutError, DEFAULT_EXECUTION_TIMEOUT_MS } from "./executor.js";
import { buildProof } from "./proof.js";
import { bestEffortField, bestEffortInput } from "./errors.js";

export interface GatewayOptions {
  authenticator: Authenticator;
  connectors: ConnectorRegistry;
  credentials: CredentialBroker;
  /** Identifies this Gateway process/instance in every proof it produces. Defaults to a fresh UUID. */
  runtime_id?: string;
}

/**
 * Vortex Gateway — the controlled execution boundary between governed
 * requests and external or local capabilities (spec/vortex-gateway.md).
 *
 * Gateway execution is not authorization by itself: a caller successfully
 * invoking the Gateway means the Gateway's own MUSTs were satisfied
 * (authenticated, valid, resolvable, in-scope, executed-or-not, proofed).
 * It says nothing about whether a higher authority (e.g. Vortex MCP policy
 * / GOS3) should have allowed the request to reach the Gateway in the
 * first place. That authorization is the caller's responsibility.
 */
export class Gateway {
  #authenticator: Authenticator;
  #connectors: ConnectorRegistry;
  #credentials: CredentialBroker;
  #runtime_id: string;

  constructor(opts: GatewayOptions) {
    this.#authenticator = opts.authenticator;
    this.#connectors = opts.connectors;
    this.#credentials = opts.credentials;
    this.#runtime_id = opts.runtime_id ?? randomUUID();
  }

  get runtimeId(): string {
    return this.#runtime_id;
  }

  /**
   * @throws {GatewayError} always carries a `.proof` — even on rejection,
   * so callers can log/forward proof for every outcome, not just success.
   */
  async invoke(raw: unknown, authToken: string | undefined): Promise<InvokeResult> {
    const started_at = new Date();

    // Best-effort fields for proofing a request we may not be able to fully parse yet.
    const req_id0 = bestEffortField(raw, "request_id");
    const conn_id0 = bestEffortField(raw, "connector_id");
    const op0 = bestEffortField(raw, "operation");
    const input0 = bestEffortInput(raw);

    // 1) AUTHENTICATION — happens before we trust anything else about the request.
    const auth = this.#authenticator.authenticate(authToken);
    if (!auth.authenticated) {
      throw this.#reject({
        status: "UNAUTHENTICATED",
        message: "caller authentication failed",
        request_id: req_id0,
        connector_id: conn_id0,
        operation: op0,
        input: input0,
        credential_id: null,
        started_at,
      });
    }

    // 2) VALIDATION
    const validation = validateInvokeRequest(raw);
    if (!validation.valid) {
      throw this.#reject({
        status: "INVALID_REQUEST",
        message: "invalid request: " + validation.errors.join("; "),
        request_id: req_id0,
        connector_id: conn_id0,
        operation: op0,
        input: input0,
        credential_id: null,
        started_at,
      });
    }
    const request = raw as InvokeRequest;
    const credential_id = request.credential_id ?? null;

    // 3) CAPABILITY / CONNECTOR RESOLUTION
    let connector;
    try {
      connector = this.#connectors.resolve(request.connector_id, request.operation);
    } catch (err) {
      const status: ExecutionStatus =
        err instanceof UnknownOperationError ? "UNKNOWN_OPERATION" : "UNKNOWN_CONNECTOR";
      throw this.#reject({
        status,
        message: (err as Error).message,
        request_id: request.request_id,
        connector_id: request.connector_id,
        operation: request.operation,
        input: request.input,
        credential_id,
        started_at,
      });
    }

    // 4) CREDENTIAL BOUNDARY — the secret itself never leaves this method.
    let credentialSecret: unknown = undefined;
    if (credential_id) {
      try {
        const grant = this.#credentials.resolve(credential_id, request.connector_id, request.operation);
        credentialSecret = grant.secret;
      } catch (err) {
        throw this.#reject({
          status: "CREDENTIAL_DENIED",
          message: (err as Error).message,
          request_id: request.request_id,
          connector_id: request.connector_id,
          operation: request.operation,
          input: request.input,
          credential_id,
          started_at,
        });
      }
    }

    // 5) EXECUTION (bounded by timeout) + 6) OBSERVATION
    const timeout_ms = request.timeout_ms ?? DEFAULT_EXECUTION_TIMEOUT_MS;
    try {
      const { output } = await executeWithTimeout({
        connector,
        operation: request.operation,
        input: request.input,
        request_id: request.request_id,
        credential: credentialSecret,
        timeout_ms,
      });

      const completed_at = new Date();
      const proof = buildProof({
        request_id: request.request_id,
        connector_id: request.connector_id,
        operation: request.operation,
        executed: true,
        status: "OK",
        input: request.input,
        output,
        started_at,
        completed_at,
        runtime_id: this.#runtime_id,
        credential_id,
      });
      return { ok: true, output, proof };
    } catch (err) {
      const status: ExecutionStatus = err instanceof ExecutionTimeoutError ? "TIMEOUT" : "ERROR";
      // By this point executeWithTimeout() has already called connector.invoke() —
      // the invocation genuinely occurred, whether it errored or overran its
      // deadline. Reporting executed=false here would misrepresent "we never
      // tried" as identical to "we tried and it failed", which defeats the
      // accountability the ExecutionProof exists to provide (see spec:
      // "executed = a execução do connector ocorreu, não status === OK").
      throw this.#reject({
        status,
        message: (err as Error).message,
        request_id: request.request_id,
        connector_id: request.connector_id,
        operation: request.operation,
        input: request.input,
        credential_id,
        started_at,
        executed: true,
      });
    }
  }

  #reject(args: {
    status: ExecutionStatus;
    message: string;
    request_id: string;
    connector_id: string;
    operation: string;
    input: unknown;
    credential_id: string | null;
    started_at: Date;
    /** True only when connector.invoke() actually ran (ERROR/TIMEOUT paths). */
    executed?: boolean;
  }): GatewayError {
    const completed_at = new Date();
    const proof: ExecutionProof = buildProof({
      request_id: args.request_id,
      connector_id: args.connector_id,
      operation: args.operation,
      executed: args.executed ?? false,
      status: args.status,
      input: args.input,
      output: null,
      started_at: args.started_at,
      completed_at,
      runtime_id: this.#runtime_id,
      credential_id: args.credential_id,
    });
    return new GatewayError(args.status, args.message, proof);
  }
}

