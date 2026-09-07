// GOS3 · agente: agent/llm · papel: Engineering Agent · PO: scoobiii
// fase: Technical Refinement → Local-first Runtime · data: 2026-09-07 · hora: registrada pelo Git
// antes: o arquivo possuía apenas um marcador GOS3 e uma regra operacional no cabeçalho.
// depois: o arquivo passa a carregar a proveniência GOS3 completa sem misturar regra operacional ao contrato do header.
// base: commit `feat/rhino-cad-connector`
// assinatura: agent/llm · Engineering Agent · GOS3
// commit: registrado pelo Git no commit que contém esta alteração.
import { createHash } from "node:crypto";
import { canonicalize } from "./canonical-json";

export function sha256Text(value: string): string {
  return `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;
}

export function sha256Json(value: unknown): string {
  return sha256Text(canonicalize(value));
}
