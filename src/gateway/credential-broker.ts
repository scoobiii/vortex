/**
 * GOS3 · Credential Broker
 * Secrets are resolved at runtime and never returned by the API.
 */
import { CredentialBroker, CredentialLease } from "./types";

const ENV_NAME = /^VORTEX_CREDENTIAL_([A-Z0-9_]+)$/;

export class EnvironmentCredentialBroker implements CredentialBroker {
  constructor(private readonly leaseMs = 30_000) {}

  issue(credentialId: string | undefined, connectorId: string): CredentialLease | undefined {
    if (!credentialId) return undefined;
    if (!/^vortex\.connector\.[a-z0-9-]+$/.test(connectorId)) {
      throw new Error("invalid connector id");
    }
    const envKey = `VORTEX_CREDENTIAL_${credentialId.toUpperCase().replace(/[^A-Z0-9_]/g, "_")}`;
    if (!ENV_NAME.test(envKey)) throw new Error("invalid credential id");
    const value = process.env[envKey];
    if (!value) throw new Error(`credential unavailable: ${credentialId}`);
    return { credentialId, value, expiresAt: Date.now() + this.leaseMs };
  }
}
