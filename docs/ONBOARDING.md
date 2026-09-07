# Vortex Onboarding

This guide covers three audiences: users, DevOps/operators, and agents.

## 1. User

Vortex is local-first. You can create and retain execution proofs without GitHub, cloud, or an always-on network connection.

```text
APP / CLI / AGENT
      |
      v
LOCAL VORTEX CONNECTOR
      |
      +--> execute / measure
      |
      +--> Execution Proof
      |
      +--> local durable store
      |
      +--> offline queue
                 |
              network returns
                 |
                 v
              sync remote
```

Default local data directory:

```text
~/.vortex/data/
```

Override it with `VORTEX_DATA_DIR`.

Check local state:

```bash
npm ci
npm run build
npm run vortex:status
```

No network is required for `build`, local proof persistence, or local status.

## 2. DevOps

A deployment has three independent concerns:

1. a local connector/runtime that executes work and persists proofs;
2. an optional remote sync receiver;
3. an optional GitHub control-plane adapter for repository/PR/CI validation.

The remote receiver is not the execution runtime. It accepts validated proof/benchmark envelopes.

Configure synchronization:

```bash
export VORTEX_SYNC_URL=https://your-vortex-endpoint.example/v1/sync
export VORTEX_DEVICE_ID=device-01
export VORTEX_SYNC_TOKEN=REDACTED
npm run vortex:sync
```

If the endpoint is unavailable, the local records remain pending. Retry can be performed by `SyncWorker`; it does not delete pending records on network failure.

For GitHub-backed projects, keep GitHub as the repository/PR control plane rather than making it a prerequisite for local execution:

```text
local execution
    |
    +--> local proof + benchmark
    |
    +--> optional remote sync
    |
    +--> GitHub Adapter
             |
             +--> repository ref/commit
             +--> PR state/head
             +--> CI checks
             +--> Vortex validation
```

The first GitHub Adapter is read-only. It validates repository state, PR state and CI; it does not create commits or merge PRs.

## 3. Agent

An agent must first identify the runtime and repository state, then create a proposal and execute through the local connector.

Required conceptual chain:

```text
IDENTITY
  -> POLICY
  -> PROPOSAL
  -> REPOSITORY STATE
  -> EXECUTION
  -> EVIDENCE
  -> PROOF HASH
  -> LOCAL PERSISTENCE
  -> OPTIONAL SYNC
  -> GITHUB/CI STATE
  -> VORTEX VALIDATION
```

An agent must not claim `verified` solely because an execution returned exit code zero. Side-effect verification requires appropriate receipts/observations from the runtime.

## 4. Offline to online behavior

Offline:

```text
Agent/App
  -> Local Connector
  -> execute
  -> measure
  -> hash
  -> persist
  -> pending
```

When connectivity returns:

```text
pending proof/benchmark
  -> SyncWorker
  -> HTTPS POST /v1/sync
  -> remote validation
  -> accepted IDs
  -> local records marked synced
  -> GitHub Adapter
  -> repository + PR + CI validation
```

A rejected record remains available for inspection and is not silently converted to success.

## 5. GitHub online mode

GitHub is an adapter/control-plane integration, not the local database and not the execution runtime.

The complete flow is:

```text
LOCAL CONNECTOR
      |
      +--> Execution Proof
      |
      +--> Benchmark
      |
      +--> durable local queue
      v
NETWORK RETURNS
      |
      +--> /v1/sync
      v
VORTEX REMOTE VALIDATOR
      |
      +--> repository state
      +--> policy validation
      v
GITHUB ADAPTER
      |
      +--> branch/ref commit
      +--> Pull Request
      +--> Check Runs / CI
      v
VORTEX VALIDATION
      |
      +--> commit matches proof
      +--> CI completed/success
      +--> PR open/head matches (when applicable)
      v
HUMAN / POLICY APPROVAL
      |
      v
MERGE / DEPLOY
```

This closes the distinction between `proof synchronization` and `GitHub source-control authority`.

## 6. Local development

The feature is currently on branch `feat/local-first-execution-proof` and PR #45; it is not yet merged into `main`.

Test the exact implementation without merging:

```bash
git fetch origin
git switch --track origin/feat/local-first-execution-proof
npm ci
npm run build
npm run test
```

The test suite now covers:

```text
npm run test:github  -> GitHub repository/PR/CI adapter
npm run test:e2e     -> offline -> reconnect -> sync -> GitHub/CI -> validation
```

To return to main:

```bash
git switch main
git pull --ff-only
```

The CI gate for the feature runs build plus the complete test suite.

## 7. First local smoke test

```bash
export VORTEX_DATA_DIR="$PWD/.vortex-data"
npm run vortex:status
```

The command should report `mode: offline-first` and the selected data directory. Proof creation is exercised by the local-first test suite; the CLI status command intentionally does not fabricate an execution proof.

## 8. Security rules

- Do not put GitHub tokens into proof payloads.
- Treat sync tokens as transport credentials, not runtime authority.
- Do not expose the sync receiver directly to an untrusted network without TLS and authentication.
- Do not execute commands from `/v1/sync` payloads.
- Keep local data permissions restricted to the runtime user.
- Treat repository state, policy version, execution evidence, and change hash as separate validation inputs.
- Treat a GitHub check as validation evidence, not as permission to merge by itself.
