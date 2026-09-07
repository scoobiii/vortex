// GOS3 · agente: GPT · papel: Maintainer / Engineering Agent
// fase: Technical Refinement → Runtime Federation · regra: Mexeu → Testa → Valida → Publica
// antes: E2E local-first continha DeterministicGitHubAdapter, um mock que duplicava a implementação do adapter real
// depois: E2E cobre somente execução offline, persistência, falha de rede e reconexão; GitHub é validado pelo teste do adapter real
// assinatura: GPT · Maintainer / Engineering Agent · GOS3

import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalFirstStore } from "../store";
import { recordExecution } from "../service";
import { SyncServer } from "../sync-server";
import { syncOnce, SyncTransport } from "../sync";
import { SyncBatch, SyncResult } from "../types";

class ToggleTransport implements SyncTransport {
  constructor(private online: boolean, private readonly transport: SyncTransport) {}
  setOnline(value: boolean): void { this.online = value; }
  async send(batch: SyncBatch): Promise<SyncResult> {
    if (!this.online) throw new Error("network_unavailable");
    return this.transport.send(batch);
  }
}

async function main(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), "vortex-e2e-"));
  const receiverRoot = await mkdtemp(join(tmpdir(), "vortex-receiver-"));
  const store = await LocalFirstStore.open(root);
  const receiver = await LocalFirstStore.open(receiverRoot);
  const port = 18787;
  const server = new SyncServer(receiver, { host: "127.0.0.1", port });

  try {
    await recordExecution(store, {
      execution_id: "exec-e2e-001",
      agent: { provider: "GPT", model: "test" },
      repository: { uri: "https://github.com/scoobiii/vortex", base_commit: "commit-123" },
      proposal: { proposal_id: "proposal-e2e-001", change_hash: "change-123" },
      command: "npm run test:local-first",
      exit_code: 0,
      duration_ms: 42,
      tests: { total: 1, passed: 1, failed: 0 },
      stdout: "PASS",
      policy_version: "v1",
    });

    const initial = await store.status();
    assert.equal(initial.pending_proofs, 1);
    assert.equal(initial.pending_benchmarks, 1);

    const failingTransport: SyncTransport = { send: async () => { throw new Error("network_unavailable"); } };
    await assert.rejects(() => syncOnce(store, "device-e2e", failingTransport), /network_unavailable/);
    const offline = await store.status();
    assert.equal(offline.pending_proofs, 1);
    assert.equal(offline.pending_benchmarks, 1);

    await server.listen();
    const transport = new ToggleTransport(false, {
      send: async (batch) => {
        const response = await fetch(`http://127.0.0.1:${port}/v1/sync`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(batch),
        });
        if (!response.ok) throw new Error(`sync HTTP ${response.status}`);
        return response.json() as Promise<SyncResult>;
      },
    });
    transport.setOnline(true);

    const synced = await syncOnce(store, "device-e2e", transport);
    assert.equal(synced.accepted_proofs.length, 1);
    assert.equal(synced.accepted_benchmarks.length, 1);

    const online = await store.status();
    assert.equal(online.pending_proofs, 0);
    assert.equal(online.pending_benchmarks, 0);

    const remote = await receiver.status();
    assert.equal(remote.pending_proofs, 1);
    assert.equal(remote.pending_benchmarks, 1);

    console.log("E2E: offline -> reconnect -> sync -> persisted receiver: PASS");
  } finally {
    await server.close().catch(() => undefined);
    await rm(root, { recursive: true, force: true });
    await rm(receiverRoot, { recursive: true, force: true });
  }
}

void main().catch((error) => { console.error(error); process.exitCode = 1; });
