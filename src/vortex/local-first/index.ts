// GOS3 · agente: agent/llm · papel: Engineering Agent · PO: scoobiii
// fase: Technical Refinement → Local-first Runtime · data: 2026-09-07 · hora: registrada pelo Git
// antes: o arquivo possuía apenas um marcador GOS3 e uma regra operacional no cabeçalho.
// depois: o arquivo passa a carregar a proveniência GOS3 completa sem misturar regra operacional ao contrato do header.
// base: commit `feat/rhino-cad-connector`
// assinatura: agent/llm · Engineering Agent · GOS3
// commit: registrado pelo Git no commit que contém esta alteração.
export * from "./types";
export * from "./canonical-json";
export * from "./hash";
export * from "./store";
export * from "./service";
export * from "./validation";
export * from "./sync";
export * from "./sync-server";
export * from "./sync-worker";
