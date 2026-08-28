/**
 * GOS3 · agente: selix · teste de contrato/proof
 */

import { invoke } from "../adapter";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) { console.log(`  ✓ ${message}`); passed++; }
  else { console.error(`  ✗ ${message}`); failed++; }
}

async function run() {
  console.log("\n=== SELIX / SELIC 1D — deterministic proof tests ===\n");

  const req = {
    invocation_id: "selix-test-001",
    agent: "selix" as const,
    action: "selix.selic1d" as const,
    payload: { selic_atual: 14.25, selic_ideal: 9.25, ipca: 4.50 },
    context: { sandbox: true },
  };

  const a = await invoke(req);
  assert(a.gate === "PASS", "gate === PASS");
  assert(a.claim === "executed", "claim === executed");
  assert(a.executed === true, "executed === true");
  assert(a.evidence?.exit_code === 0, "exit_code === 0");
  assert(typeof a.evidence?.input_hash === "string" && a.evidence.input_hash.length === 64, "input_hash SHA-256");
  assert(typeof a.evidence?.output_hash === "string" && a.evidence.output_hash.length === 64, "output_hash SHA-256");
  assert(a.result?.diferencial_pp === 5, "diferencial === 5.00 p.p.");
  assert(a.result?.juro_real_atual === 9.75, "juro real atual === 9.75%");
  assert(a.result?.juro_real_1d === 4.75, "juro real 1D === 4.75%");
  assert(a.result?.reducao_juro_real_pp === 5, "redução === 5.00 p.p.");
  assert(a.logs.some((x) => x.includes("input_hash=")), "log contém input_hash");
  assert(a.logs.some((x) => x.includes("output_hash=")), "log contém output_hash");

  const b = await invoke({ ...req, invocation_id: "selix-test-002" });
  assert(a.result && b.result && JSON.stringify(a.result) === JSON.stringify(b.result), "mesmos inputs → mesmo resultado");
  assert(a.evidence?.input_hash === b.evidence?.input_hash, "mesmos inputs → mesmo input_hash");
  assert(a.evidence?.output_hash === b.evidence?.output_hash, "mesmo resultado → mesmo output_hash");

  const dry = await invoke({ ...req, invocation_id: "selix-test-dry", context: { sandbox: true, dry_run: true } });
  assert(dry.executed === false, "dry_run → executed === false");
  assert(dry.claim === "not_executed", "dry_run → claim === not_executed");
  assert(dry.gate === "FAIL", "dry_run não passa gate de execução");

  console.log(`\n=== Resultado: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => { console.error(err); process.exit(1); });
