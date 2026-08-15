/**
 * Grok Runtime Reference Adapter
 * Implementa invocation-contract.md v0.1
 */

import { validateRequest, validateResponse } from "./contract";
import { getHandler, listActions } from "./handler";
import { InvocationRequest, InvocationResponse, InvocationContext } from "./types";

export async function invoke(raw: unknown): Promise<InvocationResponse> {
  const start = Date.now();
  const logs: string[] = [];

  try {
    validateRequest(raw);
    const req = raw as InvocationRequest;

    logs.push(`[adapter] invocation_id=${req.invocation_id}`);
    logs.push(`[adapter] action=${req.action}`);

    if (req.agent !== "grok") {
      throw new Error(`Este adaptador só aceita agent="grok". Recebido: "${req.agent}"`);
    }

    const ctx: InvocationContext = {
      sandbox: true,
      timeout_ms: 30_000,
      ...req.context,
    };

    const handler = getHandler(req.action);
    if (!handler) {
      const available = listActions().join(", ");
      throw new Error(`Ação desconhecida: "${req.action}". Disponíveis: ${available}`);
    }

    const { result, logs: handlerLogs } = await handler(req.payload, ctx);
    logs.push(...handlerLogs);

    const response: InvocationResponse = {
      invocation_id: req.invocation_id,
      agent: "grok",
      executed: !ctx.dry_run, // contrato: true só se realmente executou
      result,
      error: null,
      logs,
      duration_ms: Date.now() - start,
    };

    validateResponse(response);
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logs.push(`[adapter] error: ${message}`);

    const response: InvocationResponse = {
      invocation_id: (raw as any)?.invocation_id ?? "unknown",
      agent: "grok",
      executed: false, // falhou → não executou
      result: null,
      error: message,
      logs,
      duration_ms: Date.now() - start,
    };

    // Mesmo em erro, o shape do contrato deve ser válido
    validateResponse(response);
    return response;
  }
}

// CLI rápida para teste manual
if (require.main === module) {
  const fixture = process.argv.find((a) => a.startsWith("--fixture="))?.split("=")[1] ?? "ping";

  const examples: Record<string, InvocationRequest> = {
    ping: {
      invocation_id: "test-ping-001",
      agent: "grok",
      action: "ping",
      payload: {},
      context: { sandbox: true },
    },
    echo: {
      invocation_id: "test-echo-001",
      agent: "grok",
      action: "echo",
      payload: { message: "hello from GOS3 Sprint 1" },
      context: { sandbox: true },
    },
    dry: {
      invocation_id: "test-dry-001",
      agent: "grok",
      action: "echo",
      payload: { message: "não deve executar" },
      context: { sandbox: true, dry_run: true },
    },
  };

  const req = examples[fixture];
  if (!req) {
    console.error(`Fixture desconhecida. Use: ${Object.keys(examples).join(" | ")}`);
    process.exit(1);
  }

  invoke(req).then((res) => {
    console.log(JSON.stringify(res, null, 2));
  });
}
