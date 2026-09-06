/**
 * GOS3 · agente: GPT · papel: Engineering Agent / Grok Adapter
 * fase: Sprint Proof-of-Execution · data: 2026-09-06
 * assinatura: GPT · GOS3
 */

import { createHash } from "crypto";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { ActionHandler, InvocationContext } from "./types";

const handlers: Record<string, ActionHandler> = {
  echo: async (payload, ctx) => {
    const logs: string[] = [`[echo] received payload keys: ${Object.keys(payload).join(", ") || "(empty)"}`];
    if (ctx.dry_run) {
      logs.push("[echo] dry_run=true → não executou side-effect");
      return { result: { echoed: payload, mode: "dry_run" }, logs };
    }
    logs.push("[echo] no side-effect probe → executed=false");
    return { result: { echoed: payload, mode: "no_effect" }, logs };
  },

  ping: async (_payload, ctx) => ({
    result: { status: "ok", agent: "grok", role: "Runtime Reference / Sandbox Validator", sandbox: !!ctx.sandbox },
    logs: ["[ping] runtime alive", ...(ctx.sandbox ? ["[ping] sandbox mode confirmed"] : [])],
  }),

  write_sandbox_probe: async (payload, ctx) => {
    const logs: string[] = [];
    if (ctx.dry_run) {
      logs.push("[probe] dry_run=true → não escreveu arquivo");
      return { result: { mode: "dry_run" }, logs };
    }

    const value = typeof payload.value === "string" ? payload.value : JSON.stringify(payload.value ?? "probe");
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "vortex-proof-"));
    const file = path.join(dir, "effect.txt");
    await fs.writeFile(file, value, "utf8");
    const observed = await fs.readFile(file, "utf8");
    const stat = await fs.stat(file);
    const fingerprint = createHash("sha256").update(observed).update(String(stat.size)).digest("hex");

    logs.push(`[probe] wrote ${stat.size} bytes to sandbox file`);
    return {
      result: { path: file, bytes: stat.size, value: observed },
      logs,
      effect: { observed: stat.isFile() && observed === value, kind: "sandbox_file_write", fingerprint },
    };
  },

  validate_contract: async (payload, _ctx) => {
    const required = ["invocation_id", "agent", "action", "payload"];
    const missing = required.filter((k) => !(k in payload));
    const logs = ["[validate_contract] checking required fields"];
    if (missing.length) {
      logs.push(`[validate_contract] missing: ${missing.join(", ")}`);
      return { result: { valid: false, missing }, logs };
    }
    logs.push("[validate_contract] all required fields present");
    return { result: { valid: true }, logs };
  },
};

export function getHandler(action: string): ActionHandler | undefined { return handlers[action]; }
export function listActions(): string[] { return Object.keys(handlers); }
