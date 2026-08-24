import { describe, expect, it } from "vitest";
import { invoke } from "../adapter";

describe("GPT adapter", () => {
  it("rejects a different agent", async () => {
    const r = await invoke({ invocation_id: "1", agent: "grok", action: "generate", payload: {} });
    expect(r.executed).toBe(false);
    expect(r.error).toMatch(/agent/);
  });

  it("dry-run does not require credentials or network", async () => {
    const r = await invoke({ invocation_id: "2", agent: "gpt", action: "generate", payload: { input: "hello" }, context: { dry_run: true } });
    expect(r.executed).toBe(false);
    expect((r.result as { dry_run: boolean }).dry_run).toBe(true);
  });

  it("refuses real execution without an API key", async () => {
    const old = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const r = await invoke({ invocation_id: "3", agent: "gpt", action: "generate", payload: { input: "hello" } });
    if (old) process.env.OPENAI_API_KEY = old;
    expect(r.executed).toBe(false);
    expect(r.error).toMatch(/OPENAI_API_KEY/);
  });
});
