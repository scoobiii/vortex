# GPT Agent Connector

GOS3 adapter for GPT/OpenAI execution through the Vortex invocation contract.

## Truth matrix

| Capability | Status | Proof boundary |
|---|---|---|
| Invocation contract validation | REAL | local TypeScript validation |
| Dry-run | REAL | no network request; `executed=false` |
| GPT generation | REAL/conditional | requires `OPENAI_API_KEY`; calls `/v1/responses` |
| Evidence hash | REAL | SHA-256 of observed API response |
| Runtime ID | REAL | deterministic local runtime fingerprint |
| GitHub actions | NOT IN THIS ADAPTER | use Vortex GitHub tools/policy layer |
| Bash/Python/filesystem | NOT IN THIS ADAPTER | use sandbox capabilities |
| Tool execution claims | NEVER inferred | only `executed=true` after successful provider response |

## Usage

The adapter is intentionally narrow: it proves the GPT provider invocation, not arbitrary tools. External execution is refused when credentials are absent. Dry-run never calls the network.

```ts
await invoke({
  contract_version: "0.1",
  invocation_id: "demo-001",
  agent: "gpt",
  action: "generate",
  payload: { input: "hello" },
  context: { timeout_ms: 30000 }
});
```

Environment: `OPENAI_API_KEY` and optionally `OPENAI_MODEL`.

## GOS3 position

The adapter follows the Vortex truth model: identity → capability → authorization boundary → runtime → execution → observed result → evidence. It does not claim capabilities that are implemented elsewhere in the platform.
