/**
 * spec/sandbox.md §9. The spec deliberately does not mandate Docker,
 * VM, WASM, PRoot, etc. — only the observable property that an
 * operation cannot produce effects outside its declared scope. This
 * reference implementation enforces filesystem/network/process scope
 * checks in-process; a stricter deployment can swap this module for
 * an actual container/VM boundary without changing the proof format.
 */
import { resolve } from "node:path";
import type { SandboxScope } from "./types.js";
import { VortexError } from "./types.js";

export function assertPathInScope(sandbox: SandboxScope, path: string): void {
  const abs = resolve(path);
  const allowed = sandbox.filesystem_scope.some((prefix) => abs.startsWith(resolve(prefix)));
  if (!allowed) {
    throw new VortexError(
      "SANDBOX_DENIED",
      `path '${abs}' is outside sandbox '${sandbox.sandbox_id}' filesystem_scope`,
    );
  }
}

export function assertHostInScope(sandbox: SandboxScope, host: string): void {
  if (!sandbox.network_scope.includes(host)) {
    throw new VortexError(
      "SANDBOX_DENIED",
      `host '${host}' is outside sandbox '${sandbox.sandbox_id}' network_scope`,
    );
  }
}

export function assertCredentialInScope(sandbox: SandboxScope, credentialId: string): void {
  if (!sandbox.credential_scope.includes(credentialId)) {
    throw new VortexError(
      "SANDBOX_DENIED",
      `credential '${credentialId}' is outside sandbox '${sandbox.sandbox_id}' credential_scope`,
    );
  }
}

/** Wraps an async operation with the sandbox's declared timeout. */
export async function withTimeout<T>(sandbox: SandboxScope, fn: () => Promise<T>): Promise<T> {
  const timeoutMs = sandbox.resource_limits.timeout_ms;
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new VortexError("EXECUTION_TIMEOUT", `execution exceeded ${timeoutMs}ms`)),
      timeoutMs,
    );
  });
  try {
    return await Promise.race([fn(), timeout]);
  } finally {
    clearTimeout(timer!);
  }
}
