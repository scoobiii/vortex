<!-- GOS3 · agente: GPT · papel: Maintainer / Engineering Agent -->
<!-- fase: Technical Refinement → Runtime Federation · regra: Mexeu → Testa → Valida → Publica -->

# README supplement — Local-first + GitHub online path

The canonical README remains the project overview. This document records the implementation that closes the offline-to-online path.

## Execution is local-first

GitHub and cloud are **not** required to execute work, generate an Execution Proof, calculate a benchmark, or retain evidence locally.

```text
Agent / App
    |
    v
Vortex local connector
    |
    +--> execute
    +--> measure
    +--> Execution Proof
    +--> Benchmark
    +--> SHA-256 proof hash
    +--> durable local store
```

## Reconnect

When connectivity returns, pending evidence is sent through the generic Vortex sync protocol:

```text
local queue
   |
   v
POST /v1/sync
   |
   v
Vortex sync receiver
   |
   +--> validate
   +--> accept IDs
   v
local records marked synced
```

The sync endpoint is intentionally **not** the GitHub integration.

## GitHub control plane

After synchronization, the optional GitHub Adapter validates remote source-control state:

```text
Execution Proof
      |
      v
repository ref / commit
      |
      v
Pull Request
      |
      v
GitHub Check Runs / CI
      |
      v
Vortex validation
```

Validation requires the expected repository commit to match, CI checks to be completed successfully, and—when a PR is supplied—the PR to be open and its head to match the validated commit.

The first adapter is read-only. It does not execute commands, create commits, or merge PRs.

## End-to-end test

```bash
npm run test:e2e
```

The deterministic test exercises:

```text
offline execution
  -> proof + benchmark persisted
  -> network failure
  -> records remain pending
  -> reconnect
  -> /v1/sync accepted
  -> local records marked synced
  -> GitHub/CI state validated
  -> Vortex validation PASS
```

`npm test` includes the GitHub adapter test and this end-to-end test.

## Branch testing before merge

```bash
git fetch origin
git switch --track origin/feat/local-first-execution-proof
npm ci
npm run build
npm test
```

The implementation is currently on PR #45 and must pass CI before being merged into `main`.
