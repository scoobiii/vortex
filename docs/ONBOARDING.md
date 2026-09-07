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
npm install
npm run build
npm run vortex:status
```

No network is required for `build`, local proof persistence, or local status.

## 2. DevOps

A deployment needs two independent concerns:

1. a local connector/runtime that executes work and persists proofs;
2. an optional remote sync receiver.

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
    +--> local proof
    |
    +--> optional remote sync
    |
    +--> GitHub integration / PR
```

A GitHub connection should be used to read repository state, publish an approved change, and let CI/PR protections perform remote validation. It should not be required merely to run a local command or retain its proof.

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
pending proof
  -> SyncWorker
  -> HTTPS POST /v1/sync
  -> remote validation
  -> accepted IDs
  -> local records marked synced
```

A rejected record remains available for inspection and is not silently converted to success.

## 5. GitHub online mode

GitHub is an adapter/control-plane integration, not the local database.

The recommended online flow is:

```text
LOCAL CONNECTOR
      |
      +--> Execution Proof
      |
      +--> Benchmark
      |
      +--> sync
      v
VORTEX REMOTE VALIDATOR
      |
      +--> repository state / policy validation
      |
      v
GITHUB
      |
      +--> branch / PR
      +--> CI
      +--> required checks
      +--> human review
      v
    MERGE
```

This preserves the distinction between evidence synchronization and source-control authority.

## 6. Local development

The feature is currently on branch `feat/local-first-execution-proof` and PR #45; it is not yet merged into `main`.

Test the exact implementation without merging:

```bash
git fetch origin
git switch --track origin/feat/local-first-execution-proof
npm ci
npm run build
npm run test:local-first
npm run vortex:status
```

To return to main:

```bash
git switch main
git pull --ff-only
```

The CI gate for the feature runs `npm run build` and `npm run test:local-first`.

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
