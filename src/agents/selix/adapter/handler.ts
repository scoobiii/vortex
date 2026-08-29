/**
 * GOS3 · agente: selix · ação: selix.selic1d
 * Deterministic economic calculation; declared impact estimates are not re-estimated here.
 */

import { createHash } from "crypto";
import { InvocationContext, SelixResult } from "./types";

function hashJson(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex");
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function selic1d(
  payload: Record<string, unknown>,
  ctx: InvocationContext
): Promise<{ result: SelixResult; logs: string[]; inputHash: string; outputHash: string }> {
  const logs: string[] = [];
  const selicAtual = Number(payload.selic_atual);
  const selicIdeal = Number(payload.selic_ideal);
  const ipca = Number(payload.ipca);

  if (![selicAtual, selicIdeal, ipca].every(Number.isFinite)) {
    throw new Error("selic_atual, selic_ideal e ipca devem ser números finitos");
  }

  const canonicalInput = {
    selic_atual: selicAtual,
    selic_ideal: selicIdeal,
    ipca,
  };
  const inputHash = hashJson(canonicalInput);

  logs.push(`[selix] action=selix.selic1d`);
  logs.push(`[selix] input_hash=${inputHash}`);

  if (ctx.dry_run) {
    logs.push(`[selix] dry_run=true → cálculo não reivindicado como execução`);
  }

  const result: SelixResult = {
    selic_atual: round2(selicAtual),
    selic_ideal: round2(selicIdeal),
    diferencial_pp: round2(selicAtual - selicIdeal),
    ipca_proxy: round2(ipca),
    juro_real_atual: round2(selicAtual - ipca),
    juro_real_1d: round2(selicIdeal - ipca),
    reducao_juro_real_pp: round2(selicAtual - selicIdeal),
  };

  const outputHash = hashJson(result);
  logs.push(`[selix] output_hash=${outputHash}`);
  logs.push(`[selix] deterministic calculation complete`);

  return { result, logs, inputHash, outputHash };
}
