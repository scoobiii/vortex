#!/usr/bin/env node
/**
 * Vortex MCP server — spec §16/§17. Every tools/call is validated
 * through VortexEngine.handle() before any connector runs; the MCP
 * response always carries the ExecutionProof alongside the output
 * (spec §17: "O MCP é o transporte. O proof pertence ao domínio
 * Vortex.").
 */
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { FilesystemConnector } from "./connectors/filesystem.js";
import { generateKeypair, identityOf } from "./identity.js";
import { KeyRegistry } from "./key-registry.js";
import { VortexEngine } from "./engine.js";
import { loadPolicy } from "./policy.js";
import { Gos3Registry } from "./gos3.js";
import type { SandboxScope } from "./types.js";

const RUNTIME_ID = process.env.VORTEX_RUNTIME_ID ?? `runtime-${randomUUID()}`;
const AGENT_ID = process.env.VORTEX_AGENT_ID ?? "agent/llm";
const PRINCIPAL_ID = process.env.VORTEX_PRINCIPAL_ID ?? "scoobiii";
const POLICY_PATH = process.env.VORTEX_POLICY_PATH ?? new URL("../../policies/vortex-development.json", import.meta.url).pathname;
const KEY_REGISTRY_PATH = process.env.VORTEX_KEY_REGISTRY_PATH ?? new URL("../../.vortex-keys.json", import.meta.url).pathname;

const keypair = generateKeypair(`key-${new Date().toISOString().slice(0, 10)}`);
const keyRegistry = new KeyRegistry(KEY_REGISTRY_PATH);
keyRegistry.register({
  key_id: keypair.keyId,
  public_key: keypair.publicKeyB64,
  agent_id: AGENT_ID,
  principal_id: PRINCIPAL_ID,
  algorithm: "Ed25519",
});

const policy = loadPolicy(POLICY_PATH);
const gos3 = new Gos3Registry();
const filesystemConnector = new FilesystemConnector();
const connectors = new Map([[filesystemConnector.connectorId, filesystemConnector]]);

const sandbox: SandboxScope = {
  sandbox_id: "sandbox-default",
  filesystem_scope: [process.env.VORTEX_SANDBOX_ROOT ?? process.cwd()],
  network_scope: [],
  process_scope: [],
  credential_scope: [],
  resource_limits: { timeout_ms: 30_000 },
};

const engine = new VortexEngine(RUNTIME_ID, policy, connectors, keypair, gos3, undefined, new Map([[sandbox.sandbox_id, sandbox]]));

const server = new McpServer({ name: "vortex-mcp", version: "0.1.0" });

const scopeSchema = z.record(z.string(), z.unknown());

function baseArgsSchema() {
  return {
    request_id: z.string().describe("Caller-supplied idempotency key; a reused value is rejected (anti-replay)."),
    operation: z.string().describe("Capability-qualified operation, e.g. 'repository.write'."),
    scope: scopeSchema.describe("Authorization scope for this request, e.g. { repository, branch }."),
    gos3_session_id: z.string().optional().describe("Required for mutating operations under a 'required' policy rule."),
    args: z.record(z.string(), z.unknown()).describe("Operation-specific arguments (e.g. { path, content })."),
  };
}

function makeCtx(operation: string, scope: Record<string, unknown>, gos3SessionId?: string) {
  return {
    principal_id: PRINCIPAL_ID,
    agent_id: AGENT_ID,
    policy_id: policy.policy_id,
    policy_version: policy.policy_version,
    capability: operation,
    scope,
    gos3_session_id: gos3SessionId,
    sandbox_id: sandbox.sandbox_id,
  };
}

function toolResult(response: Awaited<ReturnType<VortexEngine["handle"]>>) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(response, null, 2) }],
    isError: response.status.endsWith("_ERROR") || response.status.endsWith("_DENIED") || response.status.endsWith("_REJECTED") || response.status.endsWith("_INVALID") || response.status.endsWith("_REQUIRED"),
  };
}

for (const kind of ["inspect", "propose", "execute", "branch.write"] as const) {
  server.registerTool(
    `vortex.${kind}`,
    {
      title: `Vortex ${kind}`,
      description:
        kind === "inspect"
          ? "Read-only inspection. No side effects. Always requires authorization + produces an ExecutionProof."
          : kind === "propose"
            ? "Produces an intended-change description WITHOUT executing it."
            : kind === "execute"
              ? "Executes an authorized, bounded operation and returns a signed ExecutionProof."
              : "Executes a persistent-state write (branch/commit). Typically requires prior human approval (GOS3 onboarding).",
      inputSchema: baseArgsSchema(),
    },
    async ({ request_id, operation, scope, gos3_session_id, args }) => {
      const ctx = makeCtx(operation, scope, gos3_session_id);
      const response = await engine.handle(
        { request_id, operation, kind, ctx, args },
        filesystemConnector.connectorId,
      );
      return toolResult(response);
    },
  );
}

server.registerTool(
  "vortex.gos3.onboard",
  {
    title: "GOS3 onboard",
    description:
      "Opens a GOS3 session authorizing a set of resources for subsequent mutating vortex.execute / vortex.branch.write calls. This represents the human-approval step for policy rules with approval='required'.",
    inputSchema: {
      resources: z.array(z.string()).describe("Resource URIs, e.g. ['repo:scoobiii/vortex']"),
      ttl_ms: z.number().optional(),
    },
  },
  async ({ resources, ttl_ms }) => {
    const session = engine.onboard(resources, ttl_ms);
    return { content: [{ type: "text" as const, text: JSON.stringify(session, null, 2) }] };
  },
);

server.registerTool(
  "vortex.identity",
  {
    title: "Vortex runtime identity",
    description: "Returns this runtime's cryptographic identity (public key, key_id, algorithm) for key discovery.",
    inputSchema: {},
  },
  async () => {
    const identity = identityOf(keypair, AGENT_ID, PRINCIPAL_ID);
    return { content: [{ type: "text" as const, text: JSON.stringify(identity, null, 2) }] };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
