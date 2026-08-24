import assert from "node:assert/strict";
import { invoke } from "../adapter/index";

async function run() {
  const originalKey = process.env.OPENAI_API_KEY;
  const originalModel = process.env.OPENAI_MODEL;
  delete process.env.OPENAI_API_KEY;

  try {
    // Guardrail: no secret => no external call and deterministic not_executed.
    let networkCalls = 0;
    const blockedFetch: typeof fetch = async () => {
      networkCalls += 1;
      throw new Error("network must not be called without credential");
    };
    const missing = await invoke(
      { invocation_id: "gpt-missing-key", agent: "gpt", task: "hello" },
      { fetchImpl: blockedFetch },
    );
    assert.equal(missing.executed, false);
    assert.equal(missing.claim, "not_executed");
    assert.equal(missing.status, "not_executed");
    assert.equal(networkCalls, 0);

    // Sterile test injection: credential is supplied only to the process env,
    // while HTTP is replaced by an in-memory fetch implementation.
    const secret = "test-secret-never-in-envelope";
    process.env.OPENAI_API_KEY = secret;
    process.env.OPENAI_MODEL = "gpt-test";

    let seenAuthorization = "";
    let seenBody = "";
    const fakeFetch: typeof fetch = async (_input, init) => {
      seenAuthorization = String((init?.headers as Record<string, string>)?.Authorization ?? "");
      seenBody = String(init?.body ?? "");
      return new Response(JSON.stringify({
        id: "resp_test",
        model: "gpt-test",
        output_text: "ok",
      }), { status: 200, headers: { "content-type": "application/json" } });
    };

    const success = await invoke(
      { invocation_id: "gpt-secret-boundary", agent: "gpt", task: "ping" },
      { fetchImpl: fakeFetch, baseUrl: "https://example.test/v1", runtimeId: "runtime-test" },
    );

    assert.equal(success.executed, true);
    assert.equal(success.output, "ok");
    assert.equal(success.status, "success");
    assert.match(success.evidence_hash ?? "", /^[a-f0-9]{64}$/);
    assert.equal(seenAuthorization, `Bearer ${secret}`);
    assert.ok(!JSON.stringify(success).includes(secret));
    assert.ok(!seenBody.includes(secret));

    // Invalid agent must not reach the provider even when a credential exists.
    let invalidNetworkCalls = 0;
    const invalidFetch: typeof fetch = async () => {
      invalidNetworkCalls += 1;
      throw new Error("invalid agent reached provider");
    };
    const bad = await invoke(
      { invocation_id: "gpt-invalid", agent: "wrong", task: "ping" } as any,
      { fetchImpl: invalidFetch },
    );
    assert.equal(bad.executed, false);
    assert.equal(bad.status, "error");
    assert.equal(invalidNetworkCalls, 0);

    console.log("GPT adapter tests: 3/3 passed");
  } finally {
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalKey;
    if (originalModel === undefined) delete process.env.OPENAI_MODEL;
    else process.env.OPENAI_MODEL = originalModel;
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
