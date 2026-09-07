/**
 * GOS3 · agente: GPT · papel: Engineering Agent / Grok Adapter
 * fase: Sprint Proof-of-Execution · data: 2026-09-06
 * assinatura: GPT · GOS3
 */

import { invoke } from "../adapter";
import { validateResponse, computeEvidenceHash, isContractCompliant } from "../adapter/contract";
import { ExecutionReceipt, InvocationRequest, InvocationResponse } from "../adapter/types";

let passed = 0;
let failed = 0;
function assert(condition: boolean, msg: string) {
  if (condition) { console.log(`  ✓ ${msg}`); passed++; }
  else { console.error(`  ✗ ${msg}`); failed++; }
}
function rejects(response: InvocationResponse, msg: string) {
  try { validateResponse(response); assert(false, msg); }
  catch { assert(true, msg); }
}

async function run() {
  console.log("\n=== Proof-of-Execution Contract Tests ===\n");

  // 1. execução real + efeito observado + receipt + evidence_hash
  {
    console.log("1. real execution → receipt + evidence_hash");
    const req: InvocationRequest = {
      invocation_id: "proof-001", agent: "grok", action: "write_sandbox_probe",
      payload: { value: "real-effect" }, context: { sandbox: true },
    };
    const res = await invoke(req);
    assert(res.executed === true, "executed === true");
    assert(res.receipt?.effect_observed === true, "receipt.effect_observed === true");
    assert(res.receipt !== null, "receipt presente");
    assert(typeof res.evidence_hash === "string" && res.evidence_hash.length === 64, "evidence_hash SHA-256 presente");
    assert(isContractCompliant(res), "response validado pelo contrato");
  }

  // 2. dry-run nunca pode produzir executed=true
  {
    console.log("\n2. dry-run → executed=false");
    const res = await invoke({
      invocation_id: "proof-002", agent: "grok", action: "write_sandbox_probe",
      payload: { value: "must-not-write" }, context: { sandbox: true, dry_run: true },
    });
    assert(res.executed === false, "executed === false");
    assert(res.receipt === null && res.evidence_hash === null, "sem receipt/evidence em dry-run");
    assert(isContractCompliant(res), "dry-run conforme");
  }

  const baseReceipt: ExecutionReceipt = {
    invocation_id: "proof-003", agent: "grok", action: "write_sandbox_probe",
    started_at: "2026-09-06T00:00:00.000Z", finished_at: "2026-09-06T00:00:00.010Z",
    duration_ms: 10, exit_code: 0, effect_observed: true,
    effect_kind: "sandbox_file_write", effect_fingerprint: "abc123",
  };

  // 3. executor afirma executed=true, mas não há efeito observado → REJECT
  {
    console.log("\n3. executed=true sem efeito observado → REJECT");
    const receipt = { ...baseReceipt, effect_observed: false };
    const res: InvocationResponse = {
      invocation_id: "proof-003", agent: "grok", executed: true,
      result: { stdout: "ok" }, error: null, logs: [], duration_ms: 10,
      receipt, evidence_hash: computeEvidenceHash(receipt),
    };
    rejects(res, "rejeita executed=true com effect_observed=false");
  }

  // 4. receipt adulterado depois da emissão → REJECT
  {
    console.log("\n4. receipt adulterado → REJECT");
    const evidence = computeEvidenceHash(baseReceipt);
    const tampered = { ...baseReceipt, effect_fingerprint: "tampered" };
    const res: InvocationResponse = {
      invocation_id: "proof-004", agent: "grok", executed: true,
      result: { stdout: "ok" }, error: null, logs: [], duration_ms: 10,
      receipt: tampered, evidence_hash: evidence,
    };
    rejects(res, "rejeita receipt adulterado");
  }

  // 5. evidence_hash adulterado → REJECT
  {
    console.log("\n5. evidence_hash adulterado → REJECT");
    const res: InvocationResponse = {
      invocation_id: "proof-005", agent: "grok", executed: true,
      result: { stdout: "ok" }, error: null, logs: [], duration_ms: 10,
      receipt: baseReceipt, evidence_hash: "0".repeat(64),
    };
    rejects(res, "rejeita evidence_hash adulterado");
  }

  // 6. stdout válido não prova side-effect → REJECT
  {
    console.log("\n6. stdout válido sem side-effect → REJECT");
    const res: InvocationResponse = {
      invocation_id: "proof-006", agent: "grok", executed: true,
      result: { stdout: "operação concluída" }, error: null, logs: [], duration_ms: 1,
      receipt: null, evidence_hash: null,
    };
    rejects(res, "rejeita stdout válido sem receipt/effect observado");
  }

  console.log(`\n=== Resultado: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}
run().catch((err) => { console.error(err); process.exit(1); });
