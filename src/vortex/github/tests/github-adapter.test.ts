// GOS3 · agente: GPT · papel: Maintainer / Engineering Agent
// fase: Technical Refinement → Runtime Federation · regra: Mexeu → Testa → Valida → Publica

import assert from "node:assert/strict";
import { HttpGitHubAdapter } from "../adapter";

interface Request { path: string; }
interface FakeResponse { ok: boolean; status: number; json(): Promise<unknown>; }

async function main(): Promise<void> {
  const requests: Request[] = [];
  const payloads: Record<string, unknown> = {
    "/repos/scoobiii/vortex": { full_name: "scoobiii/vortex", html_url: "https://github.com/scoobiii/vortex", default_branch: "main" },
    "/repos/scoobiii/vortex/git/ref/heads/feature%2Fproof": { object: { sha: "abc123" } },
    "/repos/scoobiii/vortex/commits/abc123/check-runs": { check_runs: [{ name: "local-first", status: "completed", conclusion: "success" }] },
    "/repos/scoobiii/vortex/pulls/45": { number: 45, state: "open", html_url: "https://github.com/scoobiii/vortex/pull/45", head: { sha: "abc123" }, base: { sha: "main456" } },
  };
  const fetchImpl: typeof fetch = async (input) => {
    const path = new URL(String(input)).pathname;
    requests.push({ path });
    const payload = payloads[path];
    if (!payload) return fakeResponse(404, { error: "not_found" });
    return fakeResponse(200, payload);
  };

  const adapter = new HttpGitHubAdapter({ fetchImpl });
  const state = await adapter.getRepositoryState("scoobiii/vortex", "feature/proof");
  assert.equal(state.commit, "abc123");
  const validation = await adapter.validate("scoobiii/vortex", "feature/proof", "abc123", 45);
  assert.equal(validation.valid, true);
  assert.deepEqual(validation.reasons, []);
  assert.equal(validation.checks[0].conclusion, "success");
  assert.equal(validation.pull_request?.head_sha, "abc123");
  assert.ok(requests.length >= 5);

  const mismatch = await adapter.validate("scoobiii/vortex", "feature/proof", "different", 45);
  assert.equal(mismatch.valid, false);
  assert.ok(mismatch.reasons.some((reason) => reason.startsWith("repository_commit_mismatch:")));

  console.log("GitHub adapter test: 7 assertions passed");
}

function fakeResponse(status: number, body: unknown): FakeResponse {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

void main().catch((error) => { console.error(error); process.exitCode = 1; });
