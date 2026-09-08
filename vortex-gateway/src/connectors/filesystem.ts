import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve, relative, isAbsolute } from "node:path";
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
 * how they are spelled (this is checked on the *resolved* path, not the
 * input string, so encoded/relative tricks don't bypass it).
 */
export class FilesystemConnector implements VortexConnector {
  readonly id = "filesystem";
  readonly operations = ["read", "write"] as const;

  #baseDir: string;

  constructor(baseDir: string) {
    this.#baseDir = resolve(baseDir);
  }

  #resolveInSandbox(inputPath: string): string {
    const target = isAbsolute(inputPath)
      ? resolve(inputPath)
      : resolve(this.#baseDir, inputPath);
    const rel = relative(this.#baseDir, target);
    // On POSIX, path.relative() between two absolute paths is always a
    // relative path (never itself absolute) — the only way out of the
    // sandbox is a leading "..". rel === "" means target === baseDir
    // itself, which is inside the sandbox by definition.
    if (rel !== "" && rel.startsWith("..")) {
      throw new SandboxEscapeError(inputPath);
    }
    return target;
  }

  async invoke(input: unknown, ctx: ConnectorContext): Promise<unknown> {
    if (ctx.operation === "read") {
      const { path } = input as ReadInput;
      const target = this.#resolveInSandbox(path);
      const content = await readFile(target, "utf8");
      return { path, content };
    }
    if (ctx.operation === "write") {
      const { path, content } = input as WriteInput;
      const target = this.#resolveInSandbox(path);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, content, "utf8");
      return { path, bytes_written: Buffer.byteLength(content, "utf8") };
    }
    throw new Error(`unsupported operation: ${ctx.operation}`);
  }
}
