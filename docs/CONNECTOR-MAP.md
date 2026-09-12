# GOS3 — Connector Map

- `src/agents/qwen05b` — existing functional Qwen 0.5B adapter.
- `src/gateway` — production gateway, credential broker, registry and execution proof.
- `connectors/ollama` — Ollama runtime boundary.
- `connectors/github` — classic GitHub connector + MCP boundary.
- `src/vortex/vua` — VUA (`vua/v1`), P&D.

```text
Cloud App / MCP Client → Vortex GitHub MCP → Gateway / Credential Broker → GitHub API
GitHub Actions Runner → Ollama → Qwen 0.5B
GitHub Actions Runner → Vortex BubblewrapSandbox
VUA → federation layer for future validation; not a Qwen runtime dependency.
```
