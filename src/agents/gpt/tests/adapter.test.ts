import assert from "node:assert/strict";
import { invoke } from "../adapter/index";

async function run() {
  const originalKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  try {
    const missing = await invoke({ invocation_id: "gpt-missing-key", agent: "gpt", task: "hello" });
    assert.equal(missing.executed, false);
    assert.equal(missing.claim, "not_executed");
    assert.equal(missing.status, "not_executed");

    let seenAuthorization = "";
    let seenBody = "";
    const fakeFetch: typeof fetch = async (_input, init) => {
      seenAuthorization = String((init?.headers as Record<string, string>)?.Authorization ?? "");
      seenBody = String(init?.body ?? "");
      return new Response(JSON.stringify({
        id: "resp_test",
        model: "gpt-5.6",
        output_text: "ok",
      }), { status: 200, headers: { "content-type": "application/json" } });
    };

    const secret = "test-secret-never-in-envelope";
    const success = await invoke(
      { invocation_id: "gpt-secret-boundary", agent: "gpt", task: "ping" },
      { apiKey: secret, fetchImpl: fakeFetch, baseUrl: "https://example.test/v1", runtimeId: "runtime-test" },
    );

    assert.equal(success.executed, true);
    assert.equal(success.output, "ok");
    assert.equal(success.status, "success");
    assert.match(success.evidence_hash ?? "", /^[a-f0-9]{64}$/);
    assert.equal(seenAuthorization, `Bearer ${secret}`);
    assert.ok(!JSON.stringify(success).includes(secret));
    assert.ok(!seenBody.includes(secret));

    const bad = await invoke(
      { invocation_id: "gpt-invalid", agent: "wrong", task: "ping" } as any,
      { apiKey: secret, fetchImpl: fakeFetch },
    );
    assert.equal(bad.executed, false);
    assert.equal(bad.status, "error");

    console.log("GPT adapter tests: 3/3 passed");
  } finally {
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
