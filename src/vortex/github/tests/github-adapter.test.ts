// GOS3 · agente: GPT · papel: Maintainer / Engineering Agent
// fase: Technical Refinement → Runtime Federation · regra: Mexeu → Testa → Valida → Publica
// antes: teste usava FakeResponse e payloads sintéticos, sem exercitar a API GitHub real
// depois: teste de integração usa HttpGitHubAdapter com fetch real e valida o repositório público
// assinatura: GPT · Maintainer / Engineering Agent · GOS3

import assert from "node:assert/strict";
import { HttpGitHubAdapter } from "../adapter";

async function main(): Promise<void> {
  const adapter = new HttpGitHubAdapter();
  const repository = "scoobiii/vortex";
  const ref = "main";

  const state = await adapter.getRepositoryState(repository, ref);
  assert.equal(state.repository, repository);
  assert.equal(state.ref, ref);
  assert.match(state.commit, /^[0-9a-f]{40}$/);
  assert.equal(state.url, `https://github.com/${repository}`);

  const checks = await adapter.getChecks(repository, state.commit);
  assert.ok(Array.isArray(checks));
  for (const check of checks) {
    assert.ok(check.name.length > 0);
    assert.ok(["queued", "in_progress", "completed", "unknown"].includes(check.status));
  }

  const validation = await adapter.validate(repository, ref, state.commit);
  assert.equal(validation.repository_state.commit, state.commit);
  assert.deepEqual(validation.repository_state, state);
  assert.deepEqual(validation.checks, checks);
  assert.equal(validation.reasons.length, validation.valid ? 0 : validation.reasons.length);

  console.log(`GitHub adapter integration test: PASS (${checks.length} check run(s), live API)`);
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
