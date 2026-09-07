// GOS3 · agente: GPT · papel: Maintainer / Engineering Agent
// fase: Technical Refinement → Runtime Federation · regra: Mexeu → Testa → Valida → Publica

export interface GitHubRepositoryState {
  repository: string;
  ref: string;
  commit: string;
  url: string;
}

export interface GitHubCheck {
  name: string;
  status: "queued" | "in_progress" | "completed" | "unknown";
  conclusion: string | null;
}

export interface GitHubPullRequestState {
  number: number;
  state: "open" | "closed" | "unknown";
  head_sha: string;
  base_sha: string;
  url: string;
}

export interface GitHubValidationResult {
  valid: boolean;
  repository_state: GitHubRepositoryState;
  pull_request?: GitHubPullRequestState;
  checks: GitHubCheck[];
  reasons: string[];
}
