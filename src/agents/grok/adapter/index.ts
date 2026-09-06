/**
 * GOS3 · agente: GPT · papel: Engineering Agent / Grok Adapter
 * fase: Sprint Proof-of-Execution · data: 2026-09-06
 * assinatura: GPT · GOS3
 */

import { validateRequest, validateResponse, computeEvidenceHash } from "./contract";
import { getHandler, listActions } from "./handler";
import { InvocationRequest, InvocationResponse, InvocationContext, ExecutionReceipt } from "./types";

export async function invoke(raw: unknown): Promise<InvocationResponse> {
  const startedAt = new Date().toISOString();
  const start = Date.now();
  const logs: string[] = [];

  try {
    validateRequest(raw);
    const req = raw as InvocationRequest;
    logs.push(`[adapter] invocation_id=${req.invocation_id}`);
    logs.push(`[adapter] action=${req.action}`);

    if (req.agent !== "grok") throw new Error(`Este adaptador só aceita agent="grok". Recebido: "${req.agent}"`);

    const ctx: InvocationContext = { sandbox: true, timeout_ms: 30_000, ...req.context };
    const handler = getHandler(req.action);
    if (!handler) throw new Error(`Ação desconhecida: "${req.action}". Disponíveis: ${listActions().join(", ")}`);

    const handlerResult = await handler(req.payload, ctx);
    logs.push(...handlerResult.logs);
    const duration = Date.now() - start;
    const finishedAt = new Date().toISOString();
    const effect = handlerResult.effect;
    const executed = !ctx.dry_run && !!effect?.observed;

    let receipt: ExecutionReceipt | null = null;
    let evidenceHash: string | null = null;
    if (executed && effect) {
      receipt = {
        invocation_id: req.invocation_id,
        agent: "grok",
        action: req.action,
        started_at: startedAt,
        finished_at: finishedAt,
        duration_ms: duration,
        exit_code: 0,
        effect_observed: effect.observed,
        effect_kind: effect.kind,
        effect_fingerprint: effect.fingerprint,
      };
      evidenceHash = computeEvidenceHash(receipt);
    }

    const response: InvocationResponse = {
      invocation_id: req.invocation_id,
      agent: "grok",
      executed,
      result: handlerResult.result,
      error: null,
      logs,
      duration_ms: duration,
      receipt,
      evidence_hash: evidenceHash,
    };

    validateResponse(response);
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logs.push(`[adapter] error: ${message}`);
    const response: InvocationResponse = {
      invocation_id: (raw as any)?.invocation_id ?? "unknown",
      agent: "grok",
      executed: false,
      result: null,
      error: message,
      logs,
      duration_ms: Date.now() - start,
      receipt: null,
      evidence_hash: null,
    };
    validateResponse(response);
    return response;
  }
}

if (require.main === module) {
  const fixture = process.argv.find((a) => a.startsWith("--fixture="))?.split("=")[1] ?? "ping";
  const examples: Record<string, InvocationRequest> = {
    ping: { invocation_id: "test-ping-001", agent: "grok", action: "ping", payload: {}, context: { sandbox: true } },
    echo: { invocation_id: "test-echo-001", agent: "grok", action: "echo", payload: { message: "hello from GOS3" }, context: { sandbox: true } },
    dry: { invocation_id: "test-dry-001", agent: "grok", action: "write_sandbox_probe", payload: { value: "não deve executar" }, context: { sandbox: true, dry_run: true } },
    probe: { invocation_id: "test-probe-001", agent: "grok", action: "write_sandbox_probe", payload: { value: "real effect" }, context: { sandbox: true } },
  };
  const req = examples[fixture];
  if (!req) { console.error(`Fixture desconhecida. Use: ${Object.keys(examples).join(" | ")}`); process.exit(1); }
  invoke(req).then((res) => console.log(JSON.stringify(res, null, 2)));
}
