# GPT Agent — Vortex

**GOS3 status:** CONDITIONAL / runtime required.

The GPT adapter is implemented, but it does not claim external execution by itself. A host must inject an authorized `RuntimeExecutor`.

## Boundaries

- **Persona:** presentation/agent identity; never execution authority.
- **GPT adapter:** validates invocation and translates runtime observations into the invocation contract.
- **Connectors:** external data/services such as ANEEL, ONS, CCEE and Yahoo Finance. Authentication is capability-scoped.
- **Runtime:** Termux/A23, VPS, Cloud Run, GCloud/Colab or another authorized execution boundary.
- **Evidence:** produced from runtime-observed stdout/stderr/exit_code/duration_ms and bound with SHA-256.

## Security rule

The adapter cannot manufacture `runtime_id`, `execution_id`, `executed=true`, or an evidence hash as proof of external execution.

`executed=true` is accepted only when a runtime observation is supplied and its evidence hash verifies.

## Expected flow

`GPT identity → authorization → capability discovery → connector/tool selection → authorized runtime → observed execution → evidence → invocation response`

## Current limitation

This implementation does not ship credentials or provider-specific network clients. Those belong in connector implementations and secret/configuration management outside the adapter contract.
