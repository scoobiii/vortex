// **GOS3** · agente: GPT · papel: Maintainer / Engineering Agent
import assert from "node:assert/strict";
import { runBoundedTask, type GitProvider, type Sandbox, type SandboxResult } from "../src/gos3/orchestrator.js";

class FakeSandbox implements Sandbox {
  constructor(private readonly results: SandboxResult[]) {}
  async run(): Promise<SandboxResult> { return this.results.shift()!; }
}

class FakeGit implements GitProvider {
  pr = 0; issue = 0; rollbacks: string[] = [];
  async head() { return "abc123"; }
  async changedFiles() { return ["src/example.ts"]; }
  async rollback(sha: string) { this.rollbacks.push(sha); }
  async createPR() { this.pr++; return "https://github.com/scoobiii/vortex/pull/TEST"; }
  async createHelpIssue() { this.issue++; return "https://github.com/scoobiii/vortex/issues/TEST"; }
}

const ok: SandboxResult = { status: "success", stdout: "qwen-ok", stderr: "", exit_code: 0, duration_ms: 2, runtime_id: "rt-test", execution_id: "exec-test", evidence_hash: "hash-ok" };
const fail: SandboxResult = { status: "error", stdout: "", stderr: "worker failed", exit_code: 1, duration_ms: 2, runtime_id: "rt-test", execution_id: "exec-test-2", evidence_hash: "hash-fail" };

async function main() {
  {
    const git = new FakeGit();
    const result = await runBoundedTask(new FakeSandbox([ok]), git, { command: "qwen" }, { limits: { max_attempts: 2, max_duration_ms: 1000 }, allowGitHub: true });
    assert.equal(result.snapshot.state, "PR_READY");
    assert.equal(git.pr, 1);
    assert.equal(git.issue, 0);
  }

  {
    const git = new FakeGit();
    const result = await runBoundedTask(new FakeSandbox([fail, fail]), git, { command: "qwen" }, { limits: { max_attempts: 2, max_duration_ms: 1000 }, allowGitHub: true });
    assert.equal(result.snapshot.state, "HELP_REQUIRED");
    assert.equal(result.snapshot.help_request?.reason, "attempt_limit");
    assert.equal(git.pr, 0);
    assert.equal(git.issue, 1);
  }

  console.log("gos3 orchestrator tests: PASS");
}

main().catch((error) => { console.error(error); process.exit(1); });
