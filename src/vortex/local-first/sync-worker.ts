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
