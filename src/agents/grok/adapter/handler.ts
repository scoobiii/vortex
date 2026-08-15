/**
 * Handlers de ação do Runtime Reference (Grok)
 * Executa de verdade no sandbox quando context.sandbox === true
 */

import { ActionHandler, InvocationContext } from "./types";

const handlers: Record<string, ActionHandler> = {
  /**
   * Echo — útil para smoke test do contrato
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
        agent: "grok",
        role: "Runtime Reference / Sandbox Validator",
        sandbox: !!ctx.sandbox,
      },
      logs,
    };
  },

  /**
   * validate_contract — auto-teste do próprio contrato
   */
  validate_contract: async (payload, _ctx) => {
    const logs: string[] = [];
    const required = ["invocation_id", "agent", "action", "payload"];
    const missing = required.filter((k) => !(k in payload));
    logs.push(`[validate_contract] checking required fields`);
    if (missing.length) {
      logs.push(`[validate_contract] missing: ${missing.join(", ")}`);
      return {
        result: { valid: false, missing },
        logs,
      };
    }
    logs.push("[validate_contract] all required fields present");
    return { result: { valid: true }, logs };
  },
};

export function getHandler(action: string): ActionHandler | undefined {
  return handlers[action];
}

export function listActions(): string[] {
  return Object.keys(handlers);
}
