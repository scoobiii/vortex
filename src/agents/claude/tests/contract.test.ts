/**
 * GOS3 · agente: `claude` · papel: `Arquiteto / Tech Writer`
 * fase: `Technical Refinement (E3)` · data: `2026-08-27`
 * antes: teste dependia de Vitest e de símbolos que o adapter não exportava
 * depois: suíte executável sem dependência extra, alinhada ao adapter real
 * base: PR #24 · feat/qwen-picoclaw-connectors
 * assinatura: `Claude · Arquiteto / Tech Writer · GOS3`
 */

import assert from "node:assert/strict";
import { invoke } from "../adapter/index";
import { checkGos3Header } from "../adapter/handler";
import { isContractCompliant, validateRequest, validateResponse } from "../adapter/contract";

async function main(): Promise<void> {
  let passed = 0;

  {
    const res = await invoke({ invocation_id: "claude-test-001", agent: "claude", action: "ping", payload: {} });
    assert.equal(res.executed, true);
    assert.equal(res.result?.status, "ok");
    assert.equal(res.agent, "claude");
    assert.equal(isContractCompliant(res), true);
    passed++;
  }

  {
    const payload = { message: "hello", n: 42 };
    const res = await invoke({ invocation_id: "claude-test-002", agent: "claude", action: "echo", payload });
    assert.deepEqual(res.result?.echoed, payload);
    assert.equal(res.executed, true);
    passed++;
  }

  {
    const res = await invoke({ invocation_id: "claude-test-003", agent: "claude", action: "echo", payload: { message: "dry" }, context: { dry_run: true } });
    assert.equal(res.executed, false);
    assert.equal(res.result?.mode, "dry_run");
    passed++;
  }

  {
    const good = { invocation_id: "x", agent: "claude", action: "ping", payload: {} };
    validateRequest(good);
    assert.throws(() => validateRequest({ invocation_id: "x" }), /agent é obrigatório/);
    passed++;
  }

  {
    const valid = [
      "> **GOS3** · agente: `claude`",
      "> fase: `Technical Refinement (E3)`",
      "> antes: teste",
      "> depois: adapter real",
      "> base: `PR #24`",
      "> assinatura: `Claude · Arquiteto / Tech Writer · GOS3`",
    ].join("\n");
    assert.equal(checkGos3Header(valid).valid, true);
    assert.equal(checkGos3Header("# sem GOS3").valid, false);
    assert.equal(checkGos3Header("> assinatura: x\n> **GOS3**").outOfOrder, true);
    passed++;
  }

  {
    assert.throws(() => validateResponse({ invocation_id: "x", agent: "claude", executed: "yes" }), /executed é OBRIGATÓRIO/);
    assert.equal(isContractCompliant({ invocation_id: "x", agent: "claude", executed: true, result: {}, error: null, logs: [], duration_ms: 1 }), true);
    passed++;
  }

  console.log(`Claude contract: ${passed}/6 PASS`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
