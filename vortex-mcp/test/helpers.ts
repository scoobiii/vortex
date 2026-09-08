// GOS3 · Vortex Foundation conformance artifact
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FilesystemConnector } from "../src/connectors/filesystem.js";
import { generateKeypair } from "../src/identity.js";
import { KeyRegistry } from "../src/key-registry.js";
import { VortexEngine } from "../src/engine.js";
import { Gos3Registry } from "../src/gos3.js";
import type { VortexPolicy, SandboxScope } from "../src/types.js";

export const AGENT_ID = "agent/test";
export const PRINCIPAL_ID = "test-principal";

export function testPolicy(): VortexPolicy {
  return {
    policy_id: "vortex-test",
    policy_version: "1",
    rules: {
      "repository.read": { approval: "automatic", allowed_scopes: { repository: "*" } },
      "repository.write": { approval: "required", allowed_scopes: { repository: "allowed/*" } },
    },
  };
}

export function makeEngineFixture() {
  const sandboxRoot = mkdtempSync(join(tmpdir(), "vortex-test-"));
  const keypair = generateKeypair("key-test");
  const registryPath = join(sandboxRoot, "keys.json");
  const registry = new KeyRegistry(registryPath);
  registry.register({
    key_id: keypair.keyId,
    public_key: keypair.publicKeyB64,
    agent_id: AGENT_ID,
    principal_id: PRINCIPAL_ID,
    algorithm: "Ed25519",
  });

  const connector = new FilesystemConnector();
  const sandbox: SandboxScope = {
    sandbox_id: "sandbox-default",
    filesystem_scope: [sandboxRoot],
    network_scope: [],
    process_scope: [],
    credential_scope: [],
    resource_limits: { timeout_ms: 5_000 },
  };
  const gos3 = new Gos3Registry();
  const engine = new VortexEngine(
    "runtime-test",
    testPolicy(),
    new Map([[connector.connectorId, connector]]),
    keypair,
    gos3,
    undefined,
    new Map([[sandbox.sandbox_id, sandbox]]),
  );

  return { sandboxRoot, keypair, registry, registryPath, connector, sandbox, gos3, engine };
}

export function ctxFor(overrides: Partial<import("../src/types.js").AuthorizationContext> = {}) {
  return {
    principal_id: PRINCIPAL_ID,
    agent_id: AGENT_ID,
    policy_id: "vortex-test",
    policy_version: "1",
    capability: "repository.read",
    scope: {},
    ...overrides,
  };
}
