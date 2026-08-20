/**
 * GOS3 · agente: Claude · papel: Arquiteto / Tech Writer (ver docs/team.md)
 * fase: Technical Refinement (E2) · data: 2026-08-17 · hora: 22:40:00 -03:00
 * antes: sem handler próprio — nenhuma ação Claude era executável, só documental
 * depois: 4 ações — ping/echo/validate_contract (paridade com Grok) + check_gos3_header (própria)
 * base: commit 75973a3
 * assinatura: Claude · Arquiteto / Tech Writer · GOS3
 */
/**
 * Handlers de ação do Proposer Agent (Claude) — Arquiteto / Tech Writer
 */

import { ActionHandler, InvocationContext } from "./types";

/**
 * Linhas obrigatórias do cabeçalho GOS3 (docs/PLAYBOOK.md item 2).
 * Cada uma precisa aparecer, nesta ordem, nas primeiras linhas do arquivo.
 */
const REQUIRED_HEADER_PREFIXES = [
  "> **GOS3**",
  "> fase:",
  "> antes:",
  "> depois:",
  "> base:",
  "> assinatura:",
];

function checkGos3Header(text: string): { valid: boolean; missing: string[]; outOfOrder: boolean } {
  const lines = text.split("\n").map((l) => l.trim());
  const missing: string[] = [];
  let lastIndex = -1;
  let outOfOrder = false;

  for (const prefix of REQUIRED_HEADER_PREFIXES) {
    const idx = lines.findIndex((l) => l.startsWith(prefix));
    if (idx === -1) {
      missing.push(prefix);
    } else if (idx < lastIndex) {
      outOfOrder = true;
    } else {
      lastIndex = idx;
    }
  }

  return { valid: missing.length === 0 && !outOfOrder, missing, outOfOrder };
}

const handlers: Record<string, ActionHandler> = {
  /**
   * Echo — paridade de contrato com o Runtime Reference (Grok)
   */
  echo: async (payload, ctx) => {
    const logs: string[] = [];
    logs.push(`[echo] received payload keys: ${Object.keys(payload).join(", ") || "(empty)"}`);
    if (ctx.dry_run) {
      logs.push("[echo] dry_run=true → não executou side-effect");
      return { result: { echoed: payload, mode: "dry_run" }, logs };
    }
    logs.push("[echo] executed=true");
    return {
      result: { echoed: payload, timestamp: new Date().toISOString() },
      logs,
    };
  },

  /**
   * ping — health check do runtime
   */
  ping: async (_payload, ctx) => {
    const logs = ["[ping] runtime alive"];
    if (ctx.sandbox) logs.push("[ping] sandbox mode confirmed");
    return {
      result: {
        status: "ok",
        agent: "claude",
        role: "Proposer / Arquiteto / Tech Writer",
        sandbox: !!ctx.sandbox,
      },
      logs,
    };
  },

  /**
   * validate_contract — auto-teste do próprio contrato (paridade com Grok)
   */
  validate_contract: async (payload, _ctx) => {
    const logs: string[] = [];
    const required = ["invocation_id", "agent", "action", "payload"];
    const missing = required.filter((k) => !(k in payload));
    logs.push("[validate_contract] checking required fields");
    if (missing.length) {
      logs.push(`[validate_contract] missing: ${missing.join(", ")}`);
      return { result: { valid: false, missing }, logs };
    }
    logs.push("[validate_contract] all required fields present");
    return { result: { valid: true }, logs };
  },

  /**
   * check_gos3_header — ação própria do papel Tech Writer.
   * payload.text: string — conteúdo de um arquivo a validar contra
   * docs/PLAYBOOK.md item 2 (cabeçalho GOS3 obrigatório).
   */
  check_gos3_header: async (payload, _ctx) => {
    const logs: string[] = [];
    const text = payload.text;
    if (typeof text !== "string") {
      logs.push("[check_gos3_header] payload.text ausente ou não é string");
      return { result: { valid: false, error: "payload.text (string) é obrigatório" }, logs };
    }
    const check = checkGos3Header(text);
    logs.push(`[check_gos3_header] linhas obrigatórias: ${REQUIRED_HEADER_PREFIXES.length}`);
    if (check.missing.length) {
      logs.push(`[check_gos3_header] faltando: ${check.missing.join(", ")}`);
    }
    if (check.outOfOrder) {
      logs.push("[check_gos3_header] linhas presentes mas fora de ordem");
    }
    if (check.valid) {
      logs.push("[check_gos3_header] cabeçalho GOS3 válido (PLAYBOOK.md item 2)");
    }
    return {
      result: { valid: check.valid, missing: check.missing, outOfOrder: check.outOfOrder },
      logs,
    };
  },
};

export function getHandler(action: string): ActionHandler | undefined {
  return handlers[action];
}

export function listActions(): string[] {
  return Object.keys(handlers);
}
