import type { VortexConnector } from "./types.js";

export class UnknownConnectorError extends Error {
  constructor(connector_id: string) {
    super(`unknown connector: ${connector_id}`);
    this.name = "UnknownConnectorError";
  }
}

export class UnknownOperationError extends Error {
  constructor(connector_id: string, operation: string) {
    super(`connector '${connector_id}' does not support operation '${operation}'`);
    this.name = "UnknownOperationError";
  }
}

/** Resolves connector_id -> VortexConnector and validates the operation is supported. */
export class ConnectorRegistry {
  #connectors = new Map<string, VortexConnector>();

  register(connector: VortexConnector): this {
    this.#connectors.set(connector.id, connector);
    return this;
  }

  /** @throws {UnknownConnectorError} @throws {UnknownOperationError} */
  resolve(connector_id: string, operation: string): VortexConnector {
    const connector = this.#connectors.get(connector_id);
    if (!connector) throw new UnknownConnectorError(connector_id);
    if (!connector.operations.includes(operation)) {
      throw new UnknownOperationError(connector_id, operation);
    }
    return connector;
  }

  has(connector_id: string): boolean {
    return this.#connectors.has(connector_id);
  }
}
