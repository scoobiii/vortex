import assert from "node:assert/strict";
import { invoke } from "../adapter";

async function main() {
  const wrong = await invoke({ invocation_id: "1", agent: "grok", action: "generate", payload: {} });
  assert.equal(wrong.executed, false);
  assert.match(wrong.error ?? "", /agent/);

  const dry = await invoke({ invocation_id: "2", agent: "gpt", action: "generate", payload: { input: "hello" }, context: { dry_run: true } });
  assert.equal(dry.executed, false);
  assert.equal((dry.result as { dry_run: boolean }).dry_run, true);

  const old = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  const missingKey = await invoke({ invocation_id: "3", agent: "gpt", action: "generate", payload: { input: "hello" } });
  if (old !== undefined) process.env.OPENAI_API_KEY = old;
  assert.equal(missingKey.executed, false);
  assert.match(missingKey.error ?? "", /OPENAI_API_KEY/);

  console.log("GPT adapter tests: 3/3 passed");
}

main().catch((error) => { console.error(error); process.exit(1); });
