// **GOS3** · agente: GPT · papel: Maintainer / Engineering Agent
// Real orchestration is bounded and evidence-gated. No autonomous/unbounded loop.
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import crypto from "node:crypto";
import { initialLoop, nextState, type AttemptEvidence, type LoopLimits, type LoopSnapshot } from "./runtime-loop.js";

const execFileAsync = promisify(execFile);

export interface SandboxResult { status: "success" | "error" | "timeout"; stdout: string; stderr: string; exit_code: number; duration_ms: number; runtime_id: string; execution_id: string; evidence_hash: string; }
export interface Sandbox { run(command: string, args: string[], timeoutMs: number): Promise<SandboxResult>; }

/** Linux sandbox adapter. Refuses to execute unsandboxed commands. */
export class BubblewrapSandbox implements Sandbox {
  constructor(private readonly cwd: string) {}
  async run(command: string, args: string[], timeoutMs: number): Promise<SandboxResult> {
    const started = Date.now();
    const runtime_id = `linux-bwrap-${process.pid}-${started}`;
    const execution_id = `exec-${crypto.randomUUID()}`;
    try {
      const { stdout, stderr } = await execFileAsync("bwrap", ["--die-with-parent", "--ro-bind", "/", "/", "--bind", this.cwd, this.cwd, "--chdir", this.cwd, "--dev", "/dev", "--proc", "/proc", "--", command, ...args], { cwd: this.cwd, timeout: timeoutMs, maxBuffer: 1024 * 1024 });
      const duration_ms = Date.now() - started;
      const evidence_hash = crypto.createHash("sha256").update(JSON.stringify({ stdout, stderr, exit_code: 0, duration_ms })).digest("hex");
      return { status: "success", stdout, stderr, exit_code: 0, duration_ms, runtime_id, execution_id, evidence_hash };
    } catch (error: any) {
      const duration_ms = Date.now() - started;
      const stdout = String(error?.stdout ?? "");
      const stderr = String(error?.stderr ?? error?.message ?? "");
      const exit_code = Number.isInteger(error?.code) ? error.code : 1;
      const status = error?.killed ? "timeout" : "error";
      const evidence_hash = crypto.createHash("sha256").update(JSON.stringify({ stdout, stderr, exit_code, duration_ms })).digest("hex");
      return { status, stdout, stderr, exit_code, duration_ms, runtime_id, execution_id, evidence_hash };
    }
  }
}

export interface GitProvider { head(): Promise<string>; changedFiles(): Promise<string[]>; rollback(sha: string): Promise<void>; createPR(title: string, body: string): Promise<string>; createHelpIssue(title: string, body: string): Promise<string>; }
export class CliGitProvider implements GitProvider {
  constructor(private readonly cwd: string) {}
  private async run(command: string, args: string[]): Promise<string> { const { stdout } = await execFileAsync(command, args, { cwd: this.cwd, maxBuffer: 1024 * 1024 }); return stdout.trim(); }
  head() { return this.run("git", ["rev-parse", "HEAD"]); }
  async changedFiles() { const out = await this.run("git", ["status", "--short"]); return out ? out.split("\n").map(x => x.slice(3).trim()).filter(Boolean) : []; }
  async rollback(sha: string) { await this.run("git", ["reset", "--hard", sha]); }
  async createPR(title: string, body: string) { return this.run("gh", ["pr", "create", "--title", title, "--body", body]); }
  async createHelpIssue(title: string, body: string) { return this.run("gh", ["issue", "create", "--title", title, "--body", body]); }
}

export interface OrchestrationOptions { limits: LoopLimits; allowGitHub: boolean; timeoutMs?: number; }
export interface OrchestrationTask { command: string; args?: string[]; verifyCommand?: string; verifyArgs?: string[]; }
export interface OrchestrationResult { snapshot: LoopSnapshot; pr_url?: string; issue_url?: string; }

export async function runBoundedTask(sandbox: Sandbox, git: GitProvider, task: OrchestrationTask, options: OrchestrationOptions): Promise<OrchestrationResult> {
  const baseline = await git.head();
  let snapshot = { ...initialLoop(options.limits), current_commit: baseline, last_good_commit: baseline };
  const timeoutMs = options.timeoutMs ?? options.limits.max_duration_ms;
  const start = Date.now();
  let pr_url: string | undefined;
  let issue_url: string | undefined;

  while (snapshot.state !== "PR_READY" && snapshot.state !== "HELP_REQUIRED") {
    const result = await sandbox.run(task.command, task.args ?? [], timeoutMs);
    const head_sha = await git.head();
    const changed_files = await git.changedFiles();
    let outcome: AttemptEvidence["outcome"] = result.status === "success" ? "pass" : "retryable_failure";
    let stderr = result.stderr;
    let stdout = result.stdout;
    let duration_ms = result.duration_ms;
    let evidence_hash = result.evidence_hash;
    if (result.status === "success" && task.verifyCommand) {
      const verify = await sandbox.run(task.verifyCommand, task.verifyArgs ?? [], timeoutMs);
      stdout += verify.stdout; stderr += verify.stderr; duration_ms += verify.duration_ms;
      evidence_hash = crypto.createHash("sha256").update(JSON.stringify({ worker: result.evidence_hash, verify: verify.evidence_hash, stdout, stderr, duration_ms })).digest("hex");
      if (verify.status !== "success" || verify.exit_code !== 0) outcome = "regression";
    }
    const attempt: AttemptEvidence = { status: result.status, executed: result.status === "success", evidence_hash, runtime_id: result.runtime_id, execution_id: result.execution_id, duration_ms, stdout, stderr, exit_code: result.exit_code, head_sha, changed_files, outcome, error: stderr || undefined };
    snapshot = nextState(snapshot, attempt, Date.now() - start);
    if (snapshot.state === "ROLLBACK" && snapshot.last_good_commit) {
      await git.rollback(snapshot.last_good_commit);
      snapshot = { ...snapshot, current_commit: snapshot.last_good_commit };
    }
  }

  if (snapshot.state === "PR_READY" && options.allowGitHub) pr_url = await git.createPR("GOS3: verified bounded task", `GOS3 execution evidence:\n\n- state: PR_READY\n- attempt: ${snapshot.attempt}\n- head: ${snapshot.current_commit}\n- evidence: ${snapshot.evidence_hashes.join(", ")}`);
  if (snapshot.state === "HELP_REQUIRED" && options.allowGitHub) issue_url = await git.createHelpIssue("GOS3 HELP_REQUIRED: bounded worker needs intervention", `GOS3 stopped safely.\n\nReason: ${snapshot.help_request?.reason}\nAttempt: ${snapshot.attempt}/${snapshot.limits.max_attempts}\nLast good commit: ${snapshot.last_good_commit ?? "none"}\nCurrent commit: ${snapshot.current_commit ?? "unknown"}\nEvidence: ${snapshot.evidence_hashes.join(", ")}`);
  return { snapshot, pr_url, issue_url };
}
