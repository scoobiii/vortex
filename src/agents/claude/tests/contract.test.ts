// **GOS3** · agente: `claude` · papel: `Arquiteto / Tech Writer` (ver docs/team.md)
// fase: `Technical Refinement → Runtime Federation` · data: `2026-09-07`
// antes: teste legado dependia de Vitest ausente e de um contrato divergente do adapter real
// depois: smoke/contract tests executam o adapter real via Node assert, sem mocks
// assinatura: `GPT · Maintainer / Engineering Agent · GOS3`

import assert from "node:assert/strict";
import { invoke } from "../adapter/index";
import { getHandler, listActions } from "../adapter/handler";
import { validateRequest, validateResponse } from "../adapter/contract";

async function main(): Promise<void> {
  const ping = await invoke({ invocation_id: "claude-test-ping-001", agent: "claude", action: "ping", payload: {} });
  assert.equal(ping.agent, "claude");
  assert.equal(ping.executed, true);
  assert.equal(ping.error, null);
  assert.equal(ping.result?.status, "ok");
  validateResponse(ping);

  const echoPayload = { message: "anti-mock-real-execution", value: 42 };
  const echo = await invoke({ invocation_id: "claude-test-echo-001", agent: "claude", action: "echo", payload: echoPayload });
  assert.deepEqual(echo.result?.echoed, echoPayload);
  assert.equal(echo.executed, true);
  assert.equal(echo.error, null);

  validateRequest({ invocation_id: "claude-test-contract-001", agent: "claude", action: "ping", payload: {} });
  assert.throws(() => validateRequest({ invocation_id: "missing-agent", action: "ping", payload: {} }), /agent é obrigatório/);

  const dryRun = await invoke({ invocation_id: "claude-test-dry-001", agent: "claude", action: "echo", payload: { message: "dry" }, context: { dry_run: true } });
  assert.equal(dryRun.executed, false);
  assert.equal(dryRun.result?.mode, "dry_run");

  const invalidAgent = await invoke({ invocation_id: "claude-test-invalid-agent-001", agent: "other-agent", action: "ping", payload: {} });
  assert.equal(invalidAgent.executed, false);
  assert.match(invalidAgent.error ?? "", /só aceita agent="claude"/);

  const unknownAction = await invoke({ invocation_id: "claude-test-unknown-action-001", agent: "claude", action: "does_not_exist", payload: {} });
  assert.equal(unknownAction.executed, false);
  assert.match(unknownAction.error ?? "", /Ação desconhecida/);

  const headerHandler = getHandler("check_gos3_header");
  assert.ok(headerHandler);
  const headerResult = await headerHandler!({ text: [
    "> **GOS3** · agente: `claude` · papel: `teste`",
    "> fase: `Technical Refinement`",
    "> antes: legado",
    "> depois: corrigido",
    "> base: `main`",
    "> assinatura: `GPT · Maintainer / Engineering Agent · GOS3`",
  ].join("\n") }, {});
  assert.equal(headerResult.result.valid, true);

  assert.deepEqual(listActions().sort(), ["check_gos3_header", "echo", "ping", "validate_contract"]);
  console.log("Claude adapter contract tests: PASS (real adapter, no mocks)");
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
