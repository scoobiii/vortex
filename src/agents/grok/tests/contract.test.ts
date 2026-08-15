/**
 * Testes de conformidade com invocation-contract.md v0.1
 * Runtime Reference Agent (Grok)
 */

import { invoke } from "../adapter";
import { validateResponse, isContractCompliant } from "../adapter/contract";
import { InvocationRequest } from "../adapter/types";

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✓ ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ ${msg}`);
    failed++;
  }
}

async function run() {
  console.log("\n=== Contract Compliance Tests (v0.1) ===\n");

  // 1. ping deve retornar executed: true
  {
    console.log("1. ping → executed: true");
    const req: InvocationRequest = {
      invocation_id: "t-001",
      agent: "grok",
      action: "ping",
      payload: {},
      context: { sandbox: true },
    };
    const res = await invoke(req);
    assert(res.executed === true, "executed === true");
    assert(res.error === null, "error === null");
    assert(res.agent === "grok", "agent === grok");
    assert(isContractCompliant(res), "shape do contrato válido");
  }

  // 2. dry_run deve retornar executed: false
  {
    console.log("\n2. dry_run → executed: false");
    const req: InvocationRequest = {
      invocation_id: "t-002",
      agent: "grok",
      action: "echo",
      payload: { msg: "dry" },
      context: { sandbox: true, dry_run: true },
    };
    const res = await invoke(req);
    assert(res.executed === false, "executed === false em dry_run");
    assert(res.error === null, "error === null");
    assert(isContractCompliant(res), "shape do contrato válido");
  }

  // 3. ação desconhecida → executed: false + error
  {
    console.log("\n3. ação desconhecida → executed: false");
    const req: InvocationRequest = {
      invocation_id: "t-003",
      agent: "grok",
      action: "acao_que_nao_existe",
      payload: {},
    };
    const res = await invoke(req);
    assert(res.executed === false, "executed === false");
    assert(typeof res.error === "string" && res.error.length > 0, "error preenchido");
    assert(isContractCompliant(res), "shape do contrato válido mesmo em erro");
  }

  // 4. agent errado → executed: false
  {
    console.log("\n4. agent != grok → executed: false");
    const req = {
      invocation_id: "t-004",
      agent: "claude",
      action: "ping",
      payload: {},
    };
    const res = await invoke(req);
    assert(res.executed === false, "executed === false");
    assert(res.error?.includes("grok") ?? false, "error menciona restrição de agent");
  }

  // 5. request inválido (sem invocation_id)
  {
    console.log("\n5. request inválido → executed: false + error");
    const res = await invoke({ agent: "grok", action: "ping", payload: {} });
    assert(res.executed === false, "executed === false");
    assert(res.error !== null, "error presente");
    assert(isContractCompliant(res), "mesmo com request quebrado, response respeita contrato");
  }

  // 6. echo normal
  {
    console.log("\n6. echo → result.echoed presente");
    const req: InvocationRequest = {
      invocation_id: "t-006",
      agent: "grok",
      action: "echo",
      payload: { hello: "GOS3" },
      context: { sandbox: true },
    };
    const res = await invoke(req);
    assert(res.executed === true, "executed === true");
    assert(res.result !== null && (res.result as any).echoed?.hello === "GOS3", "payload ecoado");
  }

  // 7. AUDITORIA: executed:true reflete execução real, não só a flag dry_run de entrada?
  //
  // Hoje `index.ts` calcula `executed: !ctx.dry_run` — ou seja, um caller pode mandar
  // dry_run: false (ou omitir) sem que o handler tenha causado nenhum efeito observável,
  // e o contrato ainda reporta executed: true. Este teste documenta essa lacuna: ele passa
  // hoje (confirmando o comportamento atual), mas NÃO prova side-effect real —
  // é sinalizador de dívida técnica, não uma garantia de auditoria.
  //
  // Critério que fecharia a lacuna de verdade: o response deveria carregar uma evidência
  // verificável de execução (ex: hash do resultado + timestamp assinado, ou um handler que
  // registre side-effect em `logs` de forma que dry_run e execução real sejam
  // estruturalmente distinguíveis além do campo `executed`).
  {
    console.log("\n7. AUDITORIA: executed:true não prova side-effect real (dívida conhecida)");
    const req: InvocationRequest = {
      invocation_id: "t-007",
      agent: "grok",
      action: "ping", // handler que não produz side-effect nenhum, só responde
      payload: {},
      context: { sandbox: true, dry_run: false },
    };
    const res = await invoke(req);

    assert(res.executed === true, "executed === true (reflete dry_run:false da entrada)");

    // Não existe, hoje, nenhum campo no contrato que distinga
    // "executou e causou efeito" de "executou e não causou nada".
    const hasExecutionEvidence =
      Array.isArray(res.logs) &&
      res.logs.some((l) => /side.?effect|hash|signed|committed/i.test(l));

    assert(
      hasExecutionEvidence === false,
      "CONHECIDO: nenhuma evidência de side-effect no response (gap documentado, ver docs/BACKLOG.md)"
    );
  }

  console.log(`\n=== Resultado: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
