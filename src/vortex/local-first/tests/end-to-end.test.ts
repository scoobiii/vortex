import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalFirstStore } from "../store";
import { recordExecution } from "../service";
import { SyncServer } from "../sync-server";
import { syncOnce, SyncTransport } from "../sync";
import { SyncBatch, SyncResult } from "../types";
import { GitHubValidationResult } from "../../github/types";
import { GitHubAdapter } from "../../github/adapter";

class ToggleTransport implements SyncTransport {
  constructor(private online: boolean, private readonly transport: SyncTransport) {}
  setOnline(value: boolean): void { this.online = value; }
  async send(batch: SyncBatch): Promise<SyncResult> {
    if (!this.online) throw new Error("network_unavailable");
    return this.transport.send(batch);
  }
}

class DeterministicGitHubAdapter implements GitHubAdapter {
  async getRepositoryState(repository: string, ref: string) { return { repository, ref, commit: "commit-123", url: `https://github.com/${repository}` }; }
  async getPullRequest(repository: string, number: number) { return { number, state: "open" as const, head_sha: "commit-123", base_sha: "main-123", url: `https://github.com/${repository}/pull/${number}` }; }
  async getChecks() { return [{ name: "local-first", status: "completed" as const, conclusion: "success" }]; }
  async validate(repository: string, ref: string, expectedCommit: string, pullRequest?: number): Promise<GitHubValidationResult> {
    const repositoryState = await this.getRepositoryState(repository, ref);
    const checks = await this.getChecks(repository, repositoryState.commit);
    const reasons: string[] = [];
    if (repositoryState.commit !== expectedCommit) reasons.push("repository_commit_mismatch");
    if (checks.some((check) => check.status !== "completed" || check.conclusion !== "success")) reasons.push("ci_not_green");
    const pr = pullRequest === undefined ? undefined : await this.getPullRequest(repository, pullRequest);
    if (pr && (pr.state !== "open" || pr.head_sha !== repositoryState.commit)) reasons.push("pull_request_not_valid");
    return { valid: reasons.length === 0, repository_state: repositoryState, ...(pr ? { pull_request: pr } : {}), checks, reasons };
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
    const transport = new ToggleTransport(false, { send: async (batch) => {
      const response = await fetch(`http://127.0.0.1:${port}/v1/sync`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(batch) });
      if (!response.ok) throw new Error(`sync HTTP ${response.status}`);
      return response.json() as Promise<SyncResult>;
    } });
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

    const validation = await new DeterministicGitHubAdapter().validate("scoobiii/vortex", "feature/proof", "commit-123", 45);
    assert.equal(validation.valid, true);
    assert.equal(validation.checks[0].conclusion, "success");
    assert.equal(validation.pull_request?.head_sha, "commit-123");

    console.log("E2E: offline -> reconnect -> sync -> GitHub/CI -> validation: PASS");
  } finally {
    await server.close().catch(() => undefined);
    await rm(root, { recursive: true, force: true });
    await rm(receiverRoot, { recursive: true, force: true });
  }
}

void main().catch((error) => { console.error(error); process.exitCode = 1; });
