// GOS3 · agente: GPT · papel: Maintainer / Engineering Agent
// fase: Technical Refinement → Runtime Federation · regra: Mexeu → Testa → Valida → Publica

import { GitHubCheck, GitHubPullRequestState, GitHubRepositoryState, GitHubValidationResult } from "./types";

interface HttpResponse {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}

type FetchLike = (input: string, init?: { headers?: Record<string, string> }) => Promise<HttpResponse>;

export interface GitHubAdapterOptions {
  token?: string;
  apiBaseUrl?: string;
  fetchImpl?: FetchLike;
}

export interface GitHubAdapter {
  getRepositoryState(repository: string, ref: string): Promise<GitHubRepositoryState>;
  getPullRequest(repository: string, number: number): Promise<GitHubPullRequestState>;
  getChecks(repository: string, ref: string): Promise<GitHubCheck[]>;
  validate(repository: string, ref: string, expectedCommit: string, pullRequest?: number): Promise<GitHubValidationResult>;
}

interface RepositoryResponse { full_name: string; html_url: string; default_branch: string; }
interface RefResponse { object: { sha: string }; }
interface PullResponse { number: number; state: string; html_url: string; head: { sha: string }; base: { sha: string }; }
interface CheckRunResponse { check_runs?: Array<{ name: string; status: string; conclusion: string | null }> }

export class HttpGitHubAdapter implements GitHubAdapter {
  private readonly baseUrl: string;
  private readonly fetchImpl: FetchLike;

  constructor(private readonly options: GitHubAdapterOptions = {}) {
    this.baseUrl = (options.apiBaseUrl ?? "https://api.github.com").replace(/\/$/, "");
    this.fetchImpl = options.fetchImpl ?? defaultFetch;
  }

  async getRepositoryState(repository: string, ref: string): Promise<GitHubRepositoryState> {
    const repo = await this.request<RepositoryResponse>(`/repos/${repositoryPath(repository)}`);
    const refData = await this.request<RefResponse>(`/repos/${repositoryPath(repository)}/git/ref/heads/${encode(ref)}`);
    return { repository: repo.full_name, ref, commit: refData.object.sha, url: repo.html_url };
  }

  async getPullRequest(repository: string, number: number): Promise<GitHubPullRequestState> {
    const pr = await this.request<PullResponse>(`/repos/${repositoryPath(repository)}/pulls/${number}`);
    return { number: pr.number, state: pr.state === "open" || pr.state === "closed" ? pr.state : "unknown", head_sha: pr.head.sha, base_sha: pr.base.sha, url: pr.html_url };
  }

  async getChecks(repository: string, ref: string): Promise<GitHubCheck[]> {
    const response = await this.request<CheckRunResponse>(`/repos/${repositoryPath(repository)}/commits/${encode(ref)}/check-runs`);
    return (response.check_runs ?? []).map((check) => ({
      name: check.name,
      status: check.status === "queued" || check.status === "in_progress" || check.status === "completed" ? check.status : "unknown",
      conclusion: check.conclusion,
    }));
  }

  async validate(repository: string, ref: string, expectedCommit: string, pullRequest?: number): Promise<GitHubValidationResult> {
    const state = await this.getRepositoryState(repository, ref);
    const checks = await this.getChecks(repository, state.commit);
    const reasons: string[] = [];
    if (state.commit !== expectedCommit) reasons.push(`repository_commit_mismatch:${state.commit}`);
    if (checks.length === 0 || checks.some((check) => check.status !== "completed" || check.conclusion !== "success")) reasons.push("ci_not_green");

    let pr: GitHubPullRequestState | undefined;
    if (pullRequest !== undefined) {
      pr = await this.getPullRequest(repository, pullRequest);
      if (pr.state !== "open") reasons.push("pull_request_not_open");
      if (pr.head_sha !== state.commit) reasons.push("pull_request_head_mismatch");
    }

    return { valid: reasons.length === 0, repository_state: state, ...(pr ? { pull_request: pr } : {}), checks, reasons };
  }

  private async request<T>(path: string): Promise<T> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      headers: {
        accept: "application/vnd.github+json",
        ...(this.options.token ? { authorization: `Bearer ${this.options.token}` } : {}),
        "x-github-api-version": "2022-11-28",
      },
    });
    if (!response.ok) throw new Error(`github_http_${response.status}`);
    return response.json() as Promise<T>;
  }
}

async function defaultFetch(input: string, init?: { headers?: Record<string, string> }): Promise<HttpResponse> {
  return fetch(input, init);
}

function repositoryPath(repository: string): string {
  const parts = repository.split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) throw new Error("invalid_github_repository");
  return `${encode(parts[0])}/${encode(parts[1])}`;
}

function encode(value: string): string { return encodeURIComponent(value); }
