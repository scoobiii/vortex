// GOS3 · Vortex Foundation conformance artifact
import { readFile, writeFile, stat } from "node:fs/promises";
import type { VortexConnector } from "../connector.js";
import type { CapabilityDeclaration, SandboxScope } from "../types.js";
import { assertPathInScope } from "../sandbox.js";
import { VortexError } from "../types.js";

/**
 * Minimal reference connector demonstrating repository.read /
 * repository.write under Vortex governance. Not a git client — it
 * operates on a working tree already checked out to the target
 * branch, which matches how the current Node/Express Gateway behaves
 * and keeps this connector spec-derivable rather than invented.
 */
export class FilesystemConnector implements VortexConnector {
  readonly connectorId = "connector/filesystem";

  readonly capabilities: CapabilityDeclaration[] = [
    {
      capability: "repository.read",
      scope: { repository: "*" },
      side_effect: false,
      approval: "automatic",
    },
    {
      capability: "repository.write",
      scope: { repository: "*" },
      side_effect: true,
      approval: "required",
    },
  ];

  async inspect(operation: string, args: Record<string, unknown>, sandbox: SandboxScope): Promise<unknown> {
    if (operation !== "repository.read") {
      throw new VortexError("POLICY_DENIED", `connector cannot inspect operation '${operation}'`);
    }
    const path = String(args.path);
    const abs = await assertPathInScope(sandbox, path);
    const st = await stat(abs);
    if (st.isDirectory()) {
      return { type: "directory", path: abs };
    }
    const content = await readFile(abs, "utf8");
    return { type: "file", path: abs, content };
  }

  async propose(operation: string, args: Record<string, unknown>, _sandbox: SandboxScope): Promise<unknown> {
    if (operation !== "repository.write") {
      throw new VortexError("POLICY_DENIED", `connector cannot propose operation '${operation}'`);
    }
    return {
      intent: "write",
      path: args.path,
      preview: typeof args.content === "string" ? args.content.slice(0, 500) : null,
      executed: false,
    };
  }

  async execute(operation: string, args: Record<string, unknown>, sandbox: SandboxScope): Promise<unknown> {
    if (operation !== "repository.write") {
      throw new VortexError("POLICY_DENIED", `connector cannot execute operation '${operation}'`);
    }
    const path = String(args.path);
    const abs = await assertPathInScope(sandbox, path);
    const content = String(args.content ?? "");
    await writeFile(abs, content, "utf8");
    return { path: abs, bytes_written: Buffer.byteLength(content, "utf8") };
  }
}
