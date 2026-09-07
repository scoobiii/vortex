// GOS3 · agente: agent/llm · papel: Engineering Agent · PO: scoobiii
// fase: Technical Refinement → Local-first Runtime · data: 2026-09-07 · hora: registrada pelo Git
// antes: o arquivo possuía apenas um marcador GOS3 e uma regra operacional no cabeçalho.
// depois: o arquivo passa a carregar a proveniência GOS3 completa sem misturar regra operacional ao contrato do header.
// base: commit `feat/rhino-cad-connector`
// assinatura: agent/llm · Engineering Agent · GOS3
// commit: registrado pelo Git no commit que contém esta alteração.
export function canonicalize(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value !== null && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return Object.keys(object).sort().reduce<Record<string, unknown>>((out, key) => {
      out[key] = sortValue(object[key]);
      return out;
    }, {});
  }
  return value;
}
