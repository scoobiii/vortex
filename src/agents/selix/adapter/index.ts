/**
 * GOS3 · agente: selix · ação: selix.selic1d
 * Runtime adapter com proof: hash + tempo + log + exit_code.
 */

import { selic1d } from "./handler";
import { SelixRequest, SelixResponse } from "./types";

export async function invoke(raw: unknown): Promise<SelixResponse> {
  const start = Date.now();
  const logs: string[] = [];

  try {
    const req = raw as SelixRequest;
    if (!req || req.agent !== "selix" || req.action !== "selix.selic1d") {
      throw new Error('request deve usar agent="selix" e action="selix.selic1d"');
    }
    if (!req.invocation_id || !req.payload) {
      throw new Error("invocation_id e payload são obrigatórios");
    }

    logs.push(`[adapter] invocation_id=${req.invocation_id}`);
    logs.push(`[adapter] action=${req.action}`);

    const { result, logs: handlerLogs, inputHash, outputHash } = await selic1d(
      req.payload as Record<string, unknown>,
      { sandbox: true, ...req.context }
    );
    logs.push(...handlerLogs);

    const duration = Date.now() - start;
    const timestamp = new Date().toISOString();
    logs.push(`[adapter] exit_code=0`);
    logs.push(`[adapter] duration_ms=${duration}`);

    return {
      invocation_id: req.invocation_id,
      agent: "selix",
      action: "selix.selic1d",
      gate: req.context?.dry_run ? "FAIL" : "PASS",
      claim: req.context?.dry_run ? "not_executed" : "executed",
      executed: !req.context?.dry_run,
      result,
      evidence: {
        input_hash: inputHash,
        output_hash: outputHash,
        timestamp,
        exit_code: 0,
        duration_ms: duration,
      },
      logs,
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const duration = Date.now() - start;
    logs.push(`[adapter] error=${message}`);
    logs.push(`[adapter] exit_code=1`);
    logs.push(`[adapter] duration_ms=${duration}`);

    return {
      invocation_id: (raw as any)?.invocation_id ?? "unknown",
      agent: "selix",
      action: "selix.selic1d",
      gate: "FAIL",
      claim: "not_executed",
      executed: false,
      result: null,
      evidence: null,
      logs,
      error: message,
    };
  }
}

if (require.main === module) {
  const raw = process.env.SELIX_INVOCATION_JSON;
  if (!raw) {
    console.error("SELIX_INVOCATION_JSON is required; refusing hardcoded economic input");
    process.exit(2);
  }

  let req: SelixRequest;
  try {
    req = JSON.parse(raw) as SelixRequest;
  } catch (err) {
    console.error(`SELIX_INVOCATION_JSON is not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(2);
  }

  invoke(req).then((res) => {
    console.log(JSON.stringify(res, null, 2));
    if (res.gate !== "PASS" || res.executed !== true || res.evidence?.exit_code !== 0) {
      process.exitCode = 1;
    }
  });
}
