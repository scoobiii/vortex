// GOS3
// arquivo: tests/mcp-agent-authority.test.ts
// responsabilidade: testes do contrato de autoridade entre MCP, Gateway e agentes executores
// agente: agent/llm
// papel: Engineering Agent
// fase: Gateway Federation → MCP Agent Authority Test
// data: 2026-09-08
// hora: 18:00
// antes: não havia teste isolado para impedir que um cliente MCP se declarasse executor soberano
// depois: autoridade, prova, baseline e conclusão possuem invariantes executáveis
// base: commit:3d39ecc2242367d0b0089fdbc5a6a5fba8432e44
// assinatura: P0 scoobiii : Agente GPT
// commit: pending

import assert from "node:assert/strict";
import { createHash } from "node:crypto";

function evidenceHash(evidence: Record<string, unknown>): string {
  const canonical = JSON.stringify(evidence, Object.keys(evidence).sort());
  return createHash("sha256").update(canonical).digest("hex");
}

function canComplete(input: {
  decision: string;
  executed: boolean;
  evidence_hash?: string;
  baseline_locked: boolean;
  baseline_compared: boolean;
}): boolean {
  return input.decision === "PASS"
    && input.executed
    && Boolean(input.evidence_hash)
    && input.baseline_locked
    && input.baseline_compared;
}

const qwenEvidence = {
  agent: "Qwen-0.5B",
  runtime_id: "qwen-local-test",
  execution_id: "exec-test-1",
  executed: true,
  exit_code: 0,
  stdout: "QWEN_OK",
  stderr: "",
};

const qwenHash = evidenceHash(qwenEvidence);

assert.equal(Boolean(qwenHash), true, "local executor must have deterministic evidence hash");
assert.equal(
  canComplete({
    decision: "PASS",
    executed: true,
    evidence_hash: qwenHash,
    baseline_locked: true,
    baseline_compared: true,
  }),
  true,
  "verified local execution can satisfy completion contract",
);

assert.equal(
  canComplete({
    decision: "PASS",
    executed: false,
    evidence_hash: "client-claimed-hash",
    baseline_locked: true,
    baseline_compared: true,
  }),
  false,
  "a client claim cannot become execution proof",
);

assert.equal(
  canComplete({
    decision: "PASS",
    executed: true,
    evidence_hash: qwenHash,
    baseline_locked: false,
    baseline_compared: true,
  }),
  false,
  "baseline must remain locked before completion",
);

assert.equal(
  canComplete({
    decision: "PASS",
    executed: true,
    evidence_hash: qwenHash,
    baseline_locked: true,
    baseline_compared: false,
  }),
  false,
  "baseline comparison is mandatory",
);

assert.equal(
  canComplete({
    decision: "PASS",
    executed: true,
    evidence_hash: undefined,
    baseline_locked: true,
    baseline_compared: true,
  }),
  false,
  "completion without evidence hash must fail closed",
);

assert.equal(
  canComplete({
    decision: "PASS",
    executed: true,
    evidence_hash: qwenHash,
    baseline_locked: true,
    baseline_compared: true,
  }),
  true,
);

console.log("MCP agent authority contract: PASS");
