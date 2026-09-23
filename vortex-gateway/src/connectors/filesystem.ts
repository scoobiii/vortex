import { readFile, writeFile, mkdir, realpath } from "node:fs/promises";
import { dirname, resolve, relative, isAbsolute, basename } from "node:path";
import type { ConnectorContext, VortexConnector } from "../types.js";

export class SandboxEscapeError extends Error {
  constructor(path: string) {
    super(`path escapes sandbox: ${path}`);
    this.name = "SandboxEscapeError";
  }
}

interface ReadInput {
  path: string;
}
interface WriteInput {
  path: string;
  content: string;
}

/**
 * Reference connector proving the VortexConnector contract end-to-end.
 * All paths are resolved against `baseDir` and MUST stay within it —
 * `..` traversal and absolute-path escapes are rejected regardless of
 * how they are spelled (checked on the *resolved* path, not the input
 * string, so relative tricks don't bypass it).
 *
 * SYMLINK SAFETY (issue #58): a purely string-based check (path.resolve +
 * prefix compare) is NOT sufficient. A symlink placed inside the sandbox
 * that points outside it (e.g. `<baseDir>/link -> /etc`) resolves to a
 * string that is "inside" the sandbox, but the filesystem call that
 * actually reads/writes follows the link to its real, external target.
 * `#resolveInSandbox` therefore resolves the REAL filesystem path (via
 * fs.realpath, walking up to the nearest existing ancestor for paths
 * whose leaf does not exist yet, e.g. a new file about to be written)
 * before checking it against the sandbox boundary.
 */
export class FilesystemConnector implements VortexConnector {
  readonly id = "filesystem";
  readonly operations = ["read", "write"] as const;

  #baseDir: string;
  #baseDirRealPromise: Promise<string>;

  constructor(baseDir: string) {
    this.#baseDir = resolve(baseDir);
    // baseDir itself might be a symlink (e.g. macOS /tmp); resolve once and
    // reuse — every subsequent check is against the REAL sandbox root.
    this.#baseDirRealPromise = realpath(this.#baseDir);
  }

  /**
   * Resolves `inputPath` to its real, symlink-free absolute filesystem
   * path and verifies it stays within the (real) sandbox root. Walks up
   * to the nearest existing ancestor when the leaf (or several trailing
   * components) does not exist yet — necessary for `write`, which is
   * usually creating a brand-new file.
   */
  async #resolveInSandbox(inputPath: string): Promise<string> {
    const baseDirReal = await this.#baseDirRealPromise;
    const target = isAbsolute(inputPath) ? resolve(inputPath) : resolve(this.#baseDir, inputPath);

    let current = target;
    const pendingSegments: string[] = []; // components that don't exist yet, deepest first

    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const real = await realpath(current);
        const finalPath = pendingSegments.length
          ? resolve(real, ...[...pendingSegments].reverse())
          : real;
        this.#assertWithinBase(baseDirReal, finalPath, inputPath);
        return finalPath;
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
        const parent = dirname(current);
        if (parent === current) {
          // Walked all the way to filesystem root without finding an
          // existing ancestor — cannot safely resolve; treat as escape.
          throw new SandboxEscapeError(inputPath);
        }
        pendingSegments.push(basename(current));
        current = parent;
      }
    }
  }

  #assertWithinBase(baseDirReal: string, target: string, originalInput: string): void {
    const rel = relative(baseDirReal, target);
    // rel === "" means target === baseDirReal itself (inside, by definition).
    // Any leading ".." means target fell outside baseDirReal.
    if (rel !== "" && (rel === ".." || rel.startsWith(".." + "/"))) {
      throw new SandboxEscapeError(originalInput);
    }
  }

  async invoke(input: unknown, ctx: ConnectorContext): Promise<unknown> {
    if (ctx.operation === "read") {
      const { path } = input as ReadInput;
      const target = await this.#resolveInSandbox(path);
      const content = await readFile(target, "utf8");
      return { path, content };
    }
    if (ctx.operation === "write") {
      const { path, content } = input as WriteInput;
      const target = await this.#resolveInSandbox(path);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, content, "utf8");
      return { path, bytes_written: Buffer.byteLength(content, "utf8") };
    }
    throw new Error(`unsupported operation: ${ctx.operation}`);
  }
}
