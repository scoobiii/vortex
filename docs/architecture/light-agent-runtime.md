# Vortex lightweight agent runtime

## Decision
Use PicoClaw as the lightweight runtime integration target rather than embedding a second heavyweight agent stack. PicoClaw is Go-based and advertises a sub-10MB RAM target; Vortex remains the governance/verification layer.

Source: https://github.com/sipeed/picoclaw

## Boundaries

- **Vortex:** invocation contract, GOS3 governance, evidence, tests and connector registry.
- **Lucas:** configurable agent profile and skills.
- **PicoClaw:** optional lightweight agent loop/runtime.
- **Ollama:** local model transport.
- **Qwen 2.5 Coder 0.5B:** initial local model.

No provider fallback is implicit. A connector response must identify the provider/model actually used.

## Generic connector interface

Connectors implement `VortexConnector` in `src/connectors/connector.ts`. This deliberately accepts model, tool, memory, channel, data and runtime connectors so future GitHub, Drive, MCP, database or other integrations do not require changes to the agent contract.
