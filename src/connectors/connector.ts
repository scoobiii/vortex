/** GOS3 · Vortex Connector Contract · extensible external/runtime boundary */

export type ConnectorKind = "model" | "tool" | "memory" | "channel" | "data" | "runtime";

export interface ConnectorContext {
  agent?: string;
  timeoutMs?: number;
  metadata?: Record<string, string>;
}

export interface ConnectorRequest {
  input: unknown;
  context?: ConnectorContext;
}

export interface ConnectorResponse<T = unknown> {
  ok: boolean;
  output?: T;
  error?: string;
  providerUsed?: string;
  modelUsed?: string;
  evidenceHash?: string;
  metadata?: Record<string, unknown>;
}

export interface VortexConnector<TRequest extends ConnectorRequest = ConnectorRequest, TResponse = unknown> {
  readonly id: string;
  readonly kind: ConnectorKind;
  invoke(request: TRequest): Promise<ConnectorResponse<TResponse>>;
}

export function connector<TRequest extends ConnectorRequest, TResponse>(
  definition: VortexConnector<TRequest, TResponse>,
): VortexConnector<TRequest, TResponse> {
  return definition;
}
