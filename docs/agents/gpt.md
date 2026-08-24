# GPT / OpenAI Agent

## Purpose

Vortex adapter for invoking GPT through the canonical invocation contract. The adapter is a provider connector, not a replacement for the Vortex sandbox or policy engine.

## Capabilities

- `generate`: real OpenAI Responses API invocation when `OPENAI_API_KEY` is present.
- `dry_run`: deterministic local validation with zero external side effects.
- Evidence: SHA-256 over the observed provider response.
- Runtime attribution: local runtime fingerprint.

## Explicit non-capabilities

This connector does not silently claim GitHub, filesystem, shell, Python, browser, scheduling, subagent, or cloud capabilities. Those belong to Vortex tools and must be authorized/executed by their respective runtime.

## Operational truth

`executed=true` means the provider request completed successfully and its response was observed. It does not mean a downstream tool side effect occurred.

Missing credentials cause a formal non-execution result rather than a fabricated success.

## Security

Do not commit API keys. Configure credentials in the execution environment. Production side-effect tests must use isolated credentials/resources and explicit policy.
