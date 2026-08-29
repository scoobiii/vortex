/**
 * GOS3 · agente: selix · teste de contrato/proof
 *
 * Economic inputs MUST come from SELIX_INVOCATION_JSON.
 * No economic fixture is allowed in this deterministic suite.
 */

import { invoke } from "../adapter";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) { console.log(`  ✓ ${message}`); passed++; }
  else { console.error(`  ✗ ${message}`); failed++; }
}

function loadOfficialRequest() {
  const raw = process.env.SELIX_INVOCATION_JSON;
  if (!raw) throw new Error("SELIX_INVOCATION_JSON is required; refusing economic fixture");

  const req = JSON.parse(raw);
  if (!req?.payload) throw new Error("SELIX_INVOCATION_JSON.payload is required");

  const { selic_atual, selic_ideal, ipca } = req.payload;
  for (const [name, value] of Object.entries({ selic_atual, selic_ideal, ipca })) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error(`Invalid official SELIX payload field: ${name}`);
    }
  }

  return req;
}

async function run() {
  console.log("\n=== SELIX / SELIC 1D — deterministic proof tests ===\n");

  const req = loadOfficialRequest();
  const expected = {
    diferencial_pp: req.payload.selic_atual - req.payload.selic_ideal,
    juro_real_atual: req.payload.selic_atual - req.payload.ipca,
    juro_real_1d: req.payload.selic_ideal - req.payload.ipca,
    reducao_juro_real_pp: req.payload.selic_atual - req.payload.selic_ideal,
  };

  const a = await invoke(req);
  assert(a.gate === "PASS", "gate === PASS");
  assert(a.claim === "executed", "claim === executed");
  assert(a.executed === true, "executed === true");
  assert(a.evidence?.exit_code === 0, "exit_code === 0");
  assert(typeof a.evidence?.input_hash === "string" && a.evidence.input_hash.length === 64, "input_hash SHA-256");
  assert(typeof a.evidence?.output_hash === "string" && a.evidence.output_hash.length === 64, "output_hash SHA-256");
  assert(a.result?.selic_atual === req.payload.selic_atual, "selic_atual propagated from official input");
  assert(a.result?.selic_ideal === req.payload.selic_ideal, "selic_ideal propagated from official input");
  assert(a.result?.ipca_proxy === req.payload.ipca, "ipca propagated from official input");
  assert(a.result?.diferencial_pp === expected.diferencial_pp, "diferencial derived from official input");
  assert(a.result?.juro_real_atual === expected.juro_real_atual, "juro real atual derived from official input");
  assert(a.result?.juro_real_1d === expected.juro_real_1d, "juro real 1D derived from official input");
  assert(a.result?.reducao_juro_real_pp === expected.reducao_juro_real_pp, "redução derived from official input");
  assert(a.logs.some((x) => x.includes("input_hash=")), "log contém input_hash");
  assert(a.logs.some((x) => x.includes("output_hash=")), "log contém output_hash");

  const b = await invoke({ ...req, invocation_id: `${req.invocation_id}-repeat` });
  assert(!!a.result && !!b.result && JSON.stringify(a.result) === JSON.stringify(b.result), "mesmos inputs → mesmo resultado");
  assert(a.evidence?.input_hash === b.evidence?.input_hash, "mesmos inputs → mesmo input_hash");
  assert(a.evidence?.output_hash === b.evidence?.output_hash, "mesmo resultado → mesmo output_hash");

  const dry = await invoke({ ...req, invocation_id: `${req.invocation_id}-dry`, context: { ...(req.context ?? {}), dry_run: true } });
  assert(dry.executed === false, "dry_run → executed === false");
  assert(dry.claim === "not_executed", "dry_run → claim === not_executed");
  assert(dry.gate === "FAIL", "dry_run não passa gate de execução");

  console.log(`\n=== Resultado: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => { console.error(err); process.exit(1); });
