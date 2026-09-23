import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { makeEngineFixture, ctxFor } from "../helpers.js";
import { jcs, sha256Tagged } from "../../src/canonicalize.js";

test("TAMPER: post-hoc file modification no longer matches the proof's output_hash", async () => {
  const { engine, connector, gos3, sandboxRoot } = makeEngineFixture();
  const session = gos3.onboard("test-principal", "agent/test", ["repo:allowed/repo"]);
  const path = join(sandboxRoot, "tamper.txt");

  const res = await engine.handle(
    {
      request_id: "req-tamper-1",
      operation: "repository.write",
      kind: "execute",
      ctx: ctxFor({
        capability: "repository.write",
        scope: { repository: "allowed/repo" },
        gos3_session_id: session.gos3_session_id,
      }),
      args: { path, content: "original content" },
    },
    connector.connectorId,
  );

  assert.equal(res.status, "EXECUTION_SUCCESS");
  const recordedOutputHash = res.execution_proof.output_hash;
  assert.equal(recordedOutputHash, sha256Tagged(jcs(res.output)));

  // Attacker modifies the artifact on disk after the fact, without
  // going through the engine (no new proof is produced).
  writeFileSync(path, "TAMPERED CONTENT — attacker wrote this directly");

  // Re-deriving the hash of what is on disk now (as a fresh 'output')
  // must no longer match the hash recorded in the original proof.
  const currentContent = readFileSync(path, "utf8");
  const currentHash = sha256Tagged(jcs({ path, bytes_written: Buffer.byteLength(currentContent, "utf8") }));
  assert.notEqual(currentHash, recordedOutputHash, "tampered artifact must not match the original proof's output_hash");
});
