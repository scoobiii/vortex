/**
 * GOS3 · agente: Claude · papel: Arquiteto / Tech Writer (ver docs/team.md)
 * fase: Technical Refinement (E2) · data: 2026-08-17 · hora: 22:40:00 -03:00
 * antes: sem entrypoint invocável — Claude só produzia specs/docs, não código rodável
 * depois: adapter Claude invocável via invoke(), mesmo padrão do Runtime Reference (Grok)
 * base: commit 75973a3
 * assinatura: Claude · Arquiteto / Tech Writer · GOS3
 */
/**
 * Claude Proposer Adapter
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

    if (req.agent !== "claude") {
      throw new Error(`Este adaptador só aceita agent="claude". Recebido: "${req.agent}"`);
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
      agent: "claude",
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
      agent: "claude",
      executed: false, // falhou → não executou
      result: null,
      error: message,
      logs,
      duration_ms: Date.now() - start,
    };

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
      agent: "claude",
      action: "ping",
      payload: {},
      context: { sandbox: true },
    },
    echo: {
      invocation_id: "test-echo-001",
      agent: "claude",
      action: "echo",
      payload: { message: "hello from Claude adapter" },
      context: { sandbox: true },
    },
    header: {
      invocation_id: "test-header-001",
      agent: "claude",
      action: "check_gos3_header",
      payload: {
        text: [
          "> **GOS3** · agente: `claude` · papel: `teste`",
          "> fase: `teste`",
          "> antes: x",
          "> depois: y",
          "> base: commit `abc`",
          "> assinatura: `claude`",
        ].join("\n"),
      },
      context: { sandbox: true },
    },
    dry: {
      invocation_id: "test-dry-001",
      agent: "claude",
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
