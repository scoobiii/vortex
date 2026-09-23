import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, symlink, writeFile, mkdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertPathInScope } from "../../src/sandbox.js";
import { VortexError } from "../../src/types.js";
import type { SandboxScope } from "../../src/types.js";

function scopeFor(root: string): SandboxScope {
  return {
    sandbox_id: "sandbox-test",
    filesystem_scope: [root],
    network_scope: [],
    process_scope: [],
    credential_scope: [],
    resource_limits: { timeout_ms: 5_000 },
  };
}

test("SBX-004: a symlink inside the sandbox pointing outside it is SANDBOX_DENIED, and the external target is untouched", async () => {
  const sandboxRoot = await mkdtemp(join(tmpdir(), "vortex-mcp-sbx-"));
  const outsideDir = await mkdtemp(join(tmpdir(), "vortex-mcp-outside-"));
  try {
    const outsideTarget = join(outsideDir, "secret.txt");
    await writeFile(outsideTarget, "untouched", "utf8");

    const linkPath = join(sandboxRoot, "escape-link");
    await symlink(outsideTarget, linkPath);

    const scope = scopeFor(sandboxRoot);
    await assert.rejects(
      () => assertPathInScope(scope, linkPath),
      (err: unknown) => {
        assert.ok(err instanceof VortexError);
        assert.equal((err as VortexError).status, "SANDBOX_DENIED");
        return true;
      },
    );

    // Prove no write ever reached the real external file via this path —
    // a purely string-based prefix check would have approved `linkPath`
    // (it IS textually inside sandboxRoot), only realpath resolution
    // catches that the symlink's target is not.
    const content = await readFile(outsideTarget, "utf8");
    assert.equal(content, "untouched");
  } finally {
    await rm(sandboxRoot, { recursive: true, force: true });
    await rm(outsideDir, { recursive: true, force: true });
  }
});

test("SBX-004b: a symlinked directory inside the sandbox pointing outside it is denied for a not-yet-existing file underneath", async () => {
  const sandboxRoot = await mkdtemp(join(tmpdir(), "vortex-mcp-sbx-"));
  const outsideDir = await mkdtemp(join(tmpdir(), "vortex-mcp-outside-"));
  try {
    const linkedDir = join(sandboxRoot, "escape-dir");
    await symlink(outsideDir, linkedDir, "dir");

    // The leaf file does not exist yet — this exercises the
    // walk-up-to-nearest-existing-ancestor path in safeRealpath().
    const newFileInsideEscapedDir = join(linkedDir, "new-file.txt");

    const scope = scopeFor(sandboxRoot);
    await assert.rejects(
      () => assertPathInScope(scope, newFileInsideEscapedDir),
      (err: unknown) => {
        assert.ok(err instanceof VortexError);
        assert.equal((err as VortexError).status, "SANDBOX_DENIED");
        return true;
      },
    );
  } finally {
    await rm(sandboxRoot, { recursive: true, force: true });
    await rm(outsideDir, { recursive: true, force: true });
  }
});

test("PREFIX-BOUNDARY: a sibling directory that merely starts with the same characters as an allowed prefix is rejected", async () => {
  // Regression for the bug where `"/a/sandbox-evil".startsWith("/a/sandbox")`
  // is true even though sandbox-evil is a SIBLING, not a descendant.
  const parent = await mkdtemp(join(tmpdir(), "vortex-mcp-parent-"));
  const allowedRoot = join(parent, "sandbox");
  const siblingRoot = join(parent, "sandbox-evil"); // starts with the same string as allowedRoot
  await mkdir(allowedRoot, { recursive: true });
  await mkdir(siblingRoot, { recursive: true });
  try {
    const siblingFile = join(siblingRoot, "secret.txt");
    await writeFile(siblingFile, "should not be reachable", "utf8");

    const scope = scopeFor(allowedRoot);
    await assert.rejects(
      () => assertPathInScope(scope, siblingFile),
      (err: unknown) => {
        assert.ok(err instanceof VortexError);
        assert.equal((err as VortexError).status, "SANDBOX_DENIED");
        return true;
      },
    );
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});

test("PREFIX-BOUNDARY: a genuine descendant of the allowed prefix is still allowed (no false positive)", async () => {
  const sandboxRoot = await mkdtemp(join(tmpdir(), "vortex-mcp-sbx-"));
  try {
    const nested = join(sandboxRoot, "nested", "dir", "file.txt");
    await mkdir(join(sandboxRoot, "nested", "dir"), { recursive: true });
    await writeFile(nested, "ok", "utf8");

    const scope = scopeFor(sandboxRoot);
    const resolved = await assertPathInScope(scope, nested);
    assert.equal(await readFile(resolved, "utf8"), "ok");
  } finally {
    await rm(sandboxRoot, { recursive: true, force: true });
  }
});
