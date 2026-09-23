// GOS3 · Vortex Foundation conformance artifact
/**
 * spec/key-discovery.md — this reference implementation declares the
 * "registry" mechanism: a local JSON-backed map of key_id -> public key.
 * A production deployment MAY instead publish /.well-known/vortex-keys
 * or bind keys to a policy's trusted issuer; the wire format of
 * ExecutionProof does not change either way.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

export interface KeyRegistryEntry {
  key_id: string;
  public_key: string; // base64 DER SPKI
  agent_id: string;
  principal_id: string;
  algorithm: "Ed25519";
}

export class KeyRegistry {
  private entries = new Map<string, KeyRegistryEntry>();

  constructor(private readonly path?: string) {
    if (path && existsSync(path)) {
      const raw = JSON.parse(readFileSync(path, "utf8")) as KeyRegistryEntry[];
      for (const e of raw) this.entries.set(e.key_id, e);
    }
  }

  register(entry: KeyRegistryEntry): void {
    this.entries.set(entry.key_id, entry);
    if (this.path) {
      writeFileSync(this.path, JSON.stringify([...this.entries.values()], null, 2));
    }
  }

  lookup(keyId: string): KeyRegistryEntry | undefined {
    return this.entries.get(keyId);
  }
}
