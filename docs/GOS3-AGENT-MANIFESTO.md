# GOS3 Agent Manifesto — Universal Agent Operating & Safety Protocol

**Status:** REQUIRED / FAIL-CLOSED  
**Scope:** every agent admitted to Vortex runtime federation  
**Version:** 1.0

## Admission rule

A provider/model name is not a capability proof. Before an agent receives consequential runtime or write capabilities, Vortex must require behavioral evidence from the actual host runtime.

An agent is `TOOLING_READY` only when it proves:

1. sandbox runtime discovery;
2. harmless sandbox execution;
3. real approved tool invocation;
4. execution receipt and evidence hash/ID;
5. honest failure reporting;
6. GOS3 Git concurrency compliance for repository work.

No proof → no capability → no consequential action.

## Behavioral proof

`accepted`, `simulated`, `mocked`, `not_executed`, a model declaration, or a README claim cannot be converted into `success`.

For `executed: true`, the invocation contract must carry verifiable runtime evidence. Vortex must preserve `execution_id`, `runtime_id`, duration, stdout/stderr/exit information as applicable, and an evidence identifier/hash.

## Capability states

- `TOOLING_READY`: all capabilities required by the assigned role have behavioral proof.
- `BLOCKED`: a required capability is missing, unavailable, denied, expired, or unproven.
- `EXCEPTION`: explicit bounded human/PO authorization; never weakens main-branch safety.

A `BLOCKED` agent cannot receive consequential write capabilities.

## Runtime federation

The Vortex scheduler must discover runtime capabilities rather than infer them from the model/provider. At minimum, the capability record should describe runtime ID, architecture, OS, memory limits, sandbox type, available tools/connectors, network policy, and permissions.

The proof must run against the selected runtime. A host may prove `sandbox.javascript`, `sandbox.python`, and an approved deterministic tool through its own executor. External connectors such as GitHub, GitLab, X, Google Cloud or MCP are host-owned and must be proven by their real connector with execution/evidence metadata.

## Git concurrency safety

All Vortex agents modifying shared repositories follow the GOS3 protocol:

```bash
git switch <agent-branch>
git fetch origin
git status --short
# preserve/commit deliberately if dirty; never rebase dirty state
git fetch origin
git rebase origin/<target-branch>
```

Never force-push `main`. Never publish directly to `main`. Never discard another agent's work with blind stash/reset/clean. On conflict, stop, preserve state, and emit evidence. Shared publication must use expected-head/CAS semantics or an equivalent server-side concurrency check.

## Onboarding envelope

```json
{
  "protocol": "GOS3",
  "manifest_version": "1.0",
  "agent_id": "<agent-id>",
  "runtime_id": "<runtime-id>",
  "status": "TOOLING_READY",
  "capabilities": ["sandbox", "tool-execution"],
  "execution_ids": ["..."],
  "evidence_ids": ["..."],
  "timestamp": "..."
}
```

Receipts must not contain credentials or secret material.

## New-agent invariant

Adding an agent to the registry does not grant capabilities. The agent must pass the same behavioral onboarding gate as every other agent. This is deliberately provider-neutral and applies to GPT, Claude, Gemini, Grok, Qwen, DeepSeek, Manus, Perplexity and future agents.
