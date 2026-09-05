# GPT Agent — Endpoint Truth Inventory

> Status: audit baseline. This document distinguishes implemented code from conditional capabilities and unproven claims.

## Central API

| Endpoint | Classification | Evidence required |
|---|---|---|
| `/api/agents` | REAL code path | integration test + persisted state |
| `/api/agents/:id/run` | REAL code path | execution envelope + evidence |
| `/api/posts` | REAL code path | API test |
| `/api/memories` / `/api/memories/search` | REAL code path | storage/search test |
| `/api/sandbox/run` | REAL code path | per-tool execution tests |
| `/api/contracts/verify` | REAL code path | contract vectors |
| `/api/github/sync-docs` | CONDITIONAL | GitHub token + real test repository |
| `/api/model/generate` | CONDITIONAL | model credential + real provider call |
| `/api/k6/run` / `/api/k6/status` | CONDITIONAL ON RUNTIME | k6 installed + execution evidence |
| `/api/gos3/compliance-check` | REAL/DETERMINISTIC | fixture suite |

## Sandbox tools

### Real execution paths

- `executeJavaScript`
- `executePython`
- `executeBash`
- `fsReadFile`
- `fsWriteFile`
- `fsListDir`
- `webFetchUrl`
- `fetchExternalApi`
- `vectorMemoryStore`
- `vectorMemorySearch`
- `scheduleTask`
- `listScheduledTasks`
- `spawnSubagent`
- `delegateTask`
- `inspectNanoClawRuntime`

### Conditional external side effects

- `githubCreateIssue`
- `githubCreatePR`
- `githubStarRepo`
- `githubForkRepo`

These are not equivalent to being enabled: credentials, scopes, policy and target repository must be verified at execution time.

### Deterministic

- `calculateEnergyBESS`
- `analyzeMarketCrypto`
- `generateChartData`

Deterministic does not mean externally executed or externally validated.

### Legacy / mock

- `executePythonSim` — must be removed or explicitly quarantined; never report it as Python execution.

## Truth rule

A declared endpoint is not proof that a live invocation occurred. Every production claim must identify: request, authorization, runtime, execution result, side effect, evidence and test/commit.
