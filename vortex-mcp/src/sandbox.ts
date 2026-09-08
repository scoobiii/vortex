/**
 * spec/sandbox.md §9. The spec deliberately does not mandate Docker,
 * VM, WASM, PRoot, etc. — only the observable property that an
 * operation cannot produce effects outside its declared scope. This
 * reference implementation enforces filesystem/network/process scope
 * checks in-process; a stricter deployment can swap this module for
 * an actual container/VM boundary without changing the proof format.
 */
import { dirname, resolve, relative, basename } from "node:path";
import { realpath } from "node:fs/promises";
import type { SandboxScope } from "./types.js";
import { VortexError } from "./types.js";

/**
 * Resolves `path` to its real, symlink-free absolute filesystem path and
 * verifies it falls within one of `sandbox.filesystem_scope`'s (also
 * realpath-resolved) prefixes.
 *
 * Two bugs this fixes relative to a naive `path.resolve()` + `startsWith()`
 * check:
 *
 * 1. SYMLINK ESCAPE — a symlink inside an allowed prefix that points
 *    outside it resolves, as a string, to a path "inside" the scope, but
 *    the filesystem call that follows it lands outside. Fixed by
 *    resolving the REAL target (walking up to the nearest existing
 *    ancestor for not-yet-existing leaves, e.g. a new file being written)
 *    before comparing against the sandbox boundary.
 *
 * 2. PREFIX BOUNDARY — `"/a/sandbox-evil".startsWith("/a/sandbox")` is
 *    `true`, even though `/a/sandbox-evil` is a sibling directory, not a
 *    descendant. A raw string-prefix check therefore incorrectly allows
 *    escapes into any directory that merely starts with the same
 *    characters as an allowed prefix. Fixed by using `path.relative()`
 *    and checking that the result is `""` or does not start with `".."`.
 */
export async function assertPathInScope(sandbox: SandboxScope, path: string): Promise<string> {
  const target = resolve(path);

  for (const prefix of sandbox.filesystem_scope) {
    const prefixReal = await safeRealpath(resolve(prefix));
    const targetReal = await safeRealpath(target);
    const rel = relative(prefixReal, targetReal);
    if (rel === "" || !(rel === ".." || rel.startsWith(".." + "/") || rel.startsWith("../"))) {
      return targetReal;
    }
  }

  throw new VortexError(
    "SANDBOX_DENIED",
    `path '${target}' is outside sandbox '${sandbox.sandbox_id}' filesystem_scope`,
  );
}

/**
 * realpath() that tolerates a not-yet-existing leaf (and ancestors), which
 * is the normal case for a file about to be written. Walks up until it
 * finds an existing ancestor, resolves THAT for real, then re-attaches the
 * non-existent trailing segments literally.
 */
async function safeRealpath(p: string): Promise<string> {
  let current = p;
  const pending: string[] = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const real = await realpath(current);
      return pending.length ? resolve(real, ...[...pending].reverse()) : real;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
      const parent = dirname(current);
      if (parent === current) {
        // Reached filesystem root without an existing ancestor.
        return p; // caller's boundary check will (correctly) reject this
      }
      pending.push(basename(current));
      current = parent;
    }
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
