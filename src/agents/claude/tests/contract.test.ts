// **GOS3** · agente: `claude` · papel: `Arquiteto / Tech Writer` (ver docs/team.md)
// fase: `Technical Refinement (E3)` · data: `2026-08-18`
// antes: README.md prometia "suíte de conformidade (6 casos)" que não existia
// depois: 6 casos implementados — cobrem as 4 ações + regra 1 + regra 2 do
//        contrato v0.1, mesmo espírito de tests/contract_test.py (Python)
// assinatura: `Claude · Arquiteto / Tech Writer · GOS3`

import { describe, expect, it } from "vitest";
import { invoke } from "../adapter/index.js";
import { checkGos3Header } from "../adapter/handler.js";
import { computeEvidenceHash, validateResponse } from "../adapter/contract.js";
import pingFixture from "./fixtures/ping.json" with { type: "json" };
import echoFixture from "./fixtures/echo.json" with { type: "json" };

describe("Claude adapter — conformidade com invocation-contract.md v0.1", () => {
  it("1. ping: responde ok e executed=true, com evidence_hash válido", () => {
    const res = invoke({ agent: "claude", action: "ping", payload: pingFixture.payload });
    expect(res.status).toBe("success");
    expect(res.executed).toBe(true);
    expect(res.evidence_hash).toBeDefined();
    expect(validateResponse(res)).toEqual([]);
  });

  it("2. echo: ecoa o payload exatamente, smoke test do contrato", () => {
    const res = invoke({ agent: "claude", action: "echo", payload: echoFixture.payload });
    expect(res.status).toBe("success");
    expect(JSON.parse(res.output.stdout)).toEqual(echoFixture.payload);
  });

  it("3. validate_contract: aceita um request bem formado", () => {
    const wellFormedRequest = {
      contract_version: "0.1",
      invocation_id: "test-001",
      agent: "claude",
      task: { kind: "tool_call", payload: "noop" },
      limits: { timeout_seconds: 5, max_output_bytes: 1024 },
    };
    const res = invoke({ agent: "claude", action: "validate_contract", payload: wellFormedRequest });
    expect(res.status).toBe("success");
    expect(JSON.parse(res.output.stdout).valid).toBe(true);
  });

  it("4. validate_contract: rejeita request com campo obrigatório ausente", () => {
    const brokenRequest = { contract_version: "0.1", invocation_id: "test-002" }; // sem agent/task/limits
    const res = invoke({ agent: "claude", action: "validate_contract", payload: brokenRequest });
    expect(res.status).toBe("error");
    const parsed = JSON.parse(res.output.stdout);
    expect(parsed.valid).toBe(false);
    expect(parsed.missing.length).toBeGreaterThan(0);
  });

  it("5. check_gos3_header: aceita cabeçalho com todos os marcadores obrigatórios", () => {
    const validHeader = [
      "> **GOS3** · agente: `claude` · papel: `Arquiteto / Tech Writer`",
      "> fase: `Technical Refinement (E3)` · data: `2026-08-18`",
      "> assinatura: `Claude · Arquiteto / Tech Writer · GOS3`",
    ].join("\n");
    const { valid, missing } = checkGos3Header(validHeader);
    expect(valid).toBe(true);
    expect(missing).toEqual([]);
  });

  it("6. check_gos3_header: rejeita texto sem cabeçalho GOS3 e lista o que falta", () => {
    const noHeader = "# Só um título qualquer, sem nada de GOS3 aqui.";
    const { valid, missing } = checkGos3Header(noHeader);
    expect(valid).toBe(false);
    expect(missing).toContain("GOS3");
    expect(missing).toContain("assinatura:");
  });
});

describe("Claude adapter — regras antifraude do contrato (regra 1 e 2)", () => {
  it("regra 1: executed=false com status=success é inválido", () => {
    const errors = validateResponse({
      contract_version: "0.1",
      invocation_id: "x",
      agent: "claude",
      status: "success",
      executed: false,
      output: { stdout: "", stderr: "" },
      duration_ms: 1,
      truncated: false,
    });
    expect(errors.some((e) => e.includes("REGRA 1"))).toBe(true);
  });

  it("regra 2: executed=true com evidence_hash forjado é inválido", () => {
    const output = { stdout: "x", stderr: "", exit_code: 0 };
    const errors = validateResponse({
      contract_version: "0.1",
      invocation_id: "x",
      agent: "claude",
      status: "success",
      executed: true,
      evidence_hash: "0".repeat(64),
      output,
      duration_ms: 10,
      truncated: false,
    });
    expect(errors.some((e) => e.includes("REGRA 2"))).toBe(true);
  });

  it("computeEvidenceHash é determinístico para a mesma entrada", () => {
    const output = { stdout: "a", stderr: "b", exit_code: 0 };
    expect(computeEvidenceHash(output, 5)).toBe(computeEvidenceHash(output, 5));
  });
});
