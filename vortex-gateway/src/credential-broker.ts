// GOS3 · Vortex Foundation conformance artifact
import type { CredentialGrant } from "./types.js";

export class UnknownCredentialError extends Error {
  constructor(credential_id: string) {
    super(`unknown credential: ${credential_id}`);
    this.name = "UnknownCredentialError";
  }
}

export class CredentialOutOfScopeError extends Error {
  constructor(credential_id: string, connector_id: string, operation: string) {
    super(
      `credential '${credential_id}' is not scoped for '${connector_id}.${operation}'`
    );
    this.name = "CredentialOutOfScopeError";
  }
}

/**
 * Fundamental rule (spec/credentials.md): "The credential belongs to the
 * execution boundary, not the agent." The caller supplies only a
 * credential_id. The broker resolves it internally and injects the opaque
 * secret into the connector's execution context — it is never returned in
 * the InvokeResponse or written into the ExecutionProof (the proof only
 * ever carries credential_id, see proof.ts).
 *
 * assertInScope() is the piece that was identified as an unexercised gap
 * in the parent Vortex MCP audit ("credential_scope implementado no código
 * mas nunca exercitado") — here it is load-bearing: every invoke() call
 * that carries a credential_id goes through it, and the conformance suite
 * has a dedicated adversarial test for the out-of-scope case.
 */
export class CredentialBroker {
  #grants = new Map<string, CredentialGrant>();

  register(grant: CredentialGrant): this {
    this.#grants.set(grant.id, grant);
    return this;
  }

  /** @throws {UnknownCredentialError} @throws {CredentialOutOfScopeError} */
  resolve(credential_id: string, connector_id: string, operation: string): CredentialGrant {
    const grant = this.#grants.get(credential_id);
    if (!grant) throw new UnknownCredentialError(credential_id);
    this.assertInScope(grant, connector_id, operation);
    return grant;
  }

  assertInScope(grant: CredentialGrant, connector_id: string, operation: string): void {
    const allowed = grant.scope.some(
      (s) => s.connector_id === connector_id && s.operations.includes(operation)
    );
    if (!allowed) {
      throw new CredentialOutOfScopeError(grant.id, connector_id, operation);
    }
  }

  has(credential_id: string): boolean {
    return this.#grants.has(credential_id);
  }
}
