# PRODUCT-TRUTH Matrix

Status: conservative audit baseline.

| Claim | Evidence | Status |
|---|---|---|
| `spec/invocation-contract.md` exists | file present | 🟡 SPECIFICATION |
| `main` protected | GitHub branch protection API returned required PR approval = 1 and enforce_admins = true | 🟢 VERIFIED |
| `src/agents/claude` exists | repository tree | 🟢 IMPLEMENTED |
| `src/agents/grok` exists | repository tree | 🟢 IMPLEMENTED |
| `src/agents/manus` exists | repository tree | 🟡 PARTIAL |
| `src/agents/metaai` exists | repository tree / commit `058e3cf` | 🟠 IMPLEMENTED / EXECUTION UNPROVEN |
| `src/agents/gpt` exists | `ls` returned `No such file or directory` | ⚫ NOT IMPLEMENTED |
| `docs/agents/gpt` exists | repository tree | 🟠 PROPOSAL / AUDIT DOCUMENTATION |
| GPT runtime is operational in Vortex | no runtime evidence | ⚫ NOT PROVEN |
| 49/49 coverage | no reproducible evidence in Vortex | ⚫ NOT CLAIMED |
| Issue #7-10 spam incident | documented external evidence | 🔴 OPEN / UNRESOLVED |

## MetaAI evidence limitation

The MetaAI adapter currently creates its own:

- `runtime_id`
- `execution_id`
- `recorded_at`
- `result_hash`

The adapter therefore demonstrates that an evidence envelope can be produced, but does not independently prove that an external runtime executed the requested operation.

Classification:

`IMPLEMENTED / EXECUTION UNPROVEN`

It must not be promoted to `REAL EXECUTION` until runtime-observed evidence exists.

## GPT truth

`src/agents/gpt/` is intentionally absent.

`docs/agents/gpt/` is documentation/proposal material and must not be interpreted as an implemented GPT adapter.

## Governance rule

A claim becomes REAL only when:

Human/Policy
→ Agent identity
→ Authorization
→ Capability
→ Tool
→ Runtime
→ Execution
→ Observed result
→ Evidence
→ Test
→ Review

is traceable.

Manifesto:

**xAI shows what the agent does.
Vortex proves what it did.**
