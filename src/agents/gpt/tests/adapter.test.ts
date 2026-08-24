import assert from "node:assert/strict";
import { invoke } from "../adapter/index";

const dry = await invoke({
  invocation_id: "test-gpt-dry-001",
  agent: "gpt",
  action: "generate",
  payload: { input: "must not call external API" },
  context: { dry_run: true },
});

assert.equal(dry.executed, false);
assert.equal(dry.status, "not_executed");
assert.equal(typeof dry.evidence_hash, "string");
assert.equal(dry.evidence_hash?.length, 64);

const noKey = await invoke({
  invocation_id: "test-gpt-no-key-001",
  agent: "gpt",
  action: "generate",
  payload: { input: "safe gate" },
});

if (!process.env.OPENAI_API_KEY) {
  assert.equal(noKey.executed, false);
  assert.equal(noKey.status, "not_executed");
  assert.match(noKey.error ?? "", /OPENAI_API_KEY/);
}

console.log("GPT adapter contract tests: PASS");
