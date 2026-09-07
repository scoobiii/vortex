// GOS3 · agente: agent/llm · papel: Engineering Agent · PO: scoobiii
// fase: Technical Refinement → Local-first Runtime · data: 2026-09-07 · hora: registrada pelo Git
// antes: o arquivo possuía apenas um marcador GOS3 e uma regra operacional no cabeçalho.
// depois: o arquivo passa a carregar a proveniência GOS3 completa sem misturar regra operacional ao contrato do header.
// base: commit `feat/rhino-cad-connector`
// assinatura: agent/llm · Engineering Agent · GOS3
// commit: registrado pelo Git no commit que contém esta alteração.
import { LocalFirstStore } from "./store";
import { SyncTransport, syncOnce } from "./sync";

export class SyncWorker {
  private timer: NodeJS.Timeout | undefined;
  private running = false;
  constructor(private readonly store: LocalFirstStore, private readonly deviceId: string, private readonly transport: SyncTransport, private readonly intervalMs = 30_000) {}
  start(): void { if (this.timer) return; this.timer = setInterval(() => { void this.runOnce(); }, this.intervalMs); this.timer.unref(); void this.runOnce(); }
  stop(): void { if (this.timer) clearInterval(this.timer); this.timer = undefined; }
  async runOnce(): Promise<boolean> {
    if (this.running) return false; this.running = true;
    try { await syncOnce(this.store, this.deviceId, this.transport); return true; }
    catch { return false; }
    finally { this.running = false; }
  }
}
