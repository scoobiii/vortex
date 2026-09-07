// GOS3 · agente: agent/llm · papel: Engineering Agent · PO: scoobiii
// fase: Technical Refinement → Local-first Runtime · data: 2026-09-07 · hora: registrada pelo Git
// antes: o arquivo possuía apenas um marcador GOS3 e uma regra operacional no cabeçalho.
// depois: o arquivo passa a carregar a proveniência GOS3 completa sem misturar regra operacional ao contrato do header.
// base: commit `feat/rhino-cad-connector`
// assinatura: agent/llm · Engineering Agent · GOS3
// commit: registrado pelo Git no commit que contém esta alteração.
import { homedir } from "node:os";
import { join } from "node:path";
import { LocalFirstStore } from "./store";
import { HttpSyncTransport, syncOnce } from "./sync";

async function main(): Promise<void> {
  const command = process.argv[2] ?? "status";
  const root = process.env.VORTEX_DATA_DIR ?? join(homedir(), ".vortex", "data");
  const store = await LocalFirstStore.open(root);
  if (command === "status") {
    console.log(JSON.stringify({ mode: "offline-first", data_dir: root, ...(await store.status()) }, null, 2)); return;
  }
  if (command === "sync") {
    const endpoint = process.env.VORTEX_SYNC_URL;
    if (!endpoint) throw new Error("VORTEX_SYNC_URL é obrigatório para sincronização");
    const result = await syncOnce(store, process.env.VORTEX_DEVICE_ID ?? "local-device", new HttpSyncTransport(endpoint, process.env.VORTEX_SYNC_TOKEN));
    console.log(JSON.stringify(result, null, 2)); return;
  }
  throw new Error(`Comando desconhecido: ${command}`);
}
main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
