// GOS3 · Vortex Foundation conformance artifact
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile as writeFileFs } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FilesystemConnector, SandboxEscapeError } from "../../src/connectors/filesystem.js";

async function withSandbox(fn: (dir: string) => Promise<void>) {
  const dir = await mkdtemp(join(tmpdir(), "vortex-gw-sandbox-"));
  try {
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const noopCtx = { request_id: "r1", operation: "write" as const, signal: new AbortController().signal };

test("SANDBOX: write within the sandbox succeeds, and the file can be read back", async () => {
  await withSandbox(async (dir) => {
    const conn = new FilesystemConnector(dir);
    const writeOut = await conn.invoke(
      { path: "notes/hello.txt", content: "oi mundo" },
      { ...noopCtx, operation: "write" }
    );
    assert.deepEqual(writeOut, { path: "notes/hello.txt", bytes_written: Buffer.byteLength("oi mundo") });

    const readOut = await conn.invoke({ path: "notes/hello.txt" }, { ...noopCtx, operation: "read" });
    assert.deepEqual(readOut, { path: "notes/hello.txt", content: "oi mundo" });
  });
});

test("SANDBOX: a path resolving exactly to the sandbox root clears the sandbox check (not rejected as an escape)", async () => {
  await withSandbox(async (dir) => {
    const conn = new FilesystemConnector(dir);
    // "." resolves to baseDir itself (rel === ""). The sandbox boundary check
    // must NOT treat this as an escape — any failure here should come from
    // the filesystem layer (you can't write a file on top of a directory),
    // not from SandboxEscapeError.
    await assert.rejects(
      () => conn.invoke({ path: ".", content: "x" }, { ...noopCtx, operation: "write" }),
      (err: unknown) => {
        assert.ok(!(err instanceof SandboxEscapeError), "must not be reported as a sandbox escape");
        return true;
      }
    );
  });
});

test("SANDBOX: relative path traversal escaping the sandbox is rejected", async () => {
  await withSandbox(async (dir) => {
    const conn = new FilesystemConnector(dir);
    await assert.rejects(
      () => conn.invoke({ path: "../escape.txt", content: "x" }, { ...noopCtx, operation: "write" }),
      SandboxEscapeError
    );
  });
});

test("SANDBOX: an absolute path outside the sandbox is rejected", async () => {
  await withSandbox(async (dir) => {
    const conn = new FilesystemConnector(dir);
    await assert.rejects(
      () => conn.invoke({ path: "/etc/passwd", content: "x" }, { ...noopCtx, operation: "write" }),
      SandboxEscapeError
    );
  });
});

test("SANDBOX: an absolute path inside the sandbox is allowed", async () => {
  await withSandbox(async (dir) => {
    const conn = new FilesystemConnector(dir);
    const abs = join(dir, "inside.txt");
    await assert.doesNotReject(() => conn.invoke({ path: abs, content: "x" }, { ...noopCtx, operation: "write" }));
  });
});

test("SBX-004: a symlink inside the sandbox pointing outside it is rejected on WRITE, and the external target is left untouched", async () => {
  const { symlink, mkdtemp: mkdtempFs, readFile: readFileFs, rm: rmFs } = await import("node:fs/promises");
  const outsideDir = await mkdtempFs(join(tmpdir(), "vortex-gw-outside-"));
  try {
    await withSandbox(async (dir) => {
      const conn = new FilesystemConnector(dir);
      const outsideTarget = join(outsideDir, "secret.txt");
      await writeFileFs(outsideTarget, "untouched", "utf8");

      const linkPath = join(dir, "escape-link");
      await symlink(outsideTarget, linkPath);

      await assert.rejects(
        () => conn.invoke({ path: "escape-link", content: "PWNED" }, { ...noopCtx, operation: "write" }),
        SandboxEscapeError
      );

      // The critical assertion: the string-based check alone would have
      // allowed this (the literal path "escape-link" is inside the
      // sandbox). Only a realpath-based check catches that the symlink's
      // TARGET is outside. Prove the external file was never touched.
      const content = await readFileFs(outsideTarget, "utf8");
      assert.equal(content, "untouched", "symlink escape must not reach the real external file");
    });
  } finally {
    await rmFs(outsideDir, { recursive: true, force: true });
  }
});

test("SBX-004: a symlink inside the sandbox pointing outside it is rejected on READ", async () => {
  const { symlink, mkdtemp: mkdtempFs, rm: rmFs } = await import("node:fs/promises");
  const outsideDir = await mkdtempFs(join(tmpdir(), "vortex-gw-outside-"));
  try {
    await withSandbox(async (dir) => {
      const conn = new FilesystemConnector(dir);
      const outsideTarget = join(outsideDir, "secret.txt");
      await writeFileFs(outsideTarget, "top secret content", "utf8");

      const linkPath = join(dir, "escape-link-read");
      await symlink(outsideTarget, linkPath);

      await assert.rejects(
        () => conn.invoke({ path: "escape-link-read" }, { ...noopCtx, operation: "read" }),
        SandboxEscapeError
      );
    });
  } finally {
    await rmFs(outsideDir, { recursive: true, force: true });
  }
});

test("SANDBOX: an unsupported operation throws", async () => {
  await withSandbox(async (dir) => {
    const conn = new FilesystemConnector(dir);
    await assert.rejects(() => conn.invoke({}, { ...noopCtx, operation: "delete" }));
  });
});

test("SANDBOX: connector declares its id and supported operations", async () => {
  await withSandbox(async (dir) => {
    const conn = new FilesystemConnector(dir);
    assert.equal(conn.id, "filesystem");
    assert.deepEqual([...conn.operations], ["read", "write"]);
  });
});
