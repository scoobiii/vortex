# GOS3 · agente: GPT · papel: Maintainer / Engineering Agent
# fase: Runtime Federation → Semantic Verification · data: 2026-09-09
# base: spec/semantic-verification-2026
# assinatura: GPT · Maintainer / Engineering Agent · GOS3

# PRODUCT-TRUTH Matrix

Status: conservative audit baseline.

| Claim | Evidence | Status |
|---|---|---|
| `spec/invocation-contract.md` v0.3 exists | contract updated with semantic verification boundary | 🟡 SPECIFICATION |
| `execution_verified` is distinct from `semantic_verified` | invocation contract v0.3 | 🟡 SPECIFICATION |
| LLM execution can produce cryptographically valid evidence while being semantically wrong | live sheep test: Qwen returned `8` for “all except 9” | 🟢 OBSERVED |
| semantic correctness is independently verified by Vortex | deterministic verifier implementation not yet evidenced in this repo snapshot | ⚫ NOT IMPLEMENTED / NOT PROVEN |
| `evidence_hash` proves semantic truth | contract explicitly rejects this interpretation | 🔴 PROHIBITED CLAIM |
| side-effect is automatically proven by `executed:true` | contract explicitly rejects this interpretation | 🔴 PROHIBITED CLAIM |
| benchmark duration always equals provider wall-clock duration | contract requires measurement-window separation | 🔴 PROHIBITED CLAIM |
| Gateway authorization occurs before adapter side-effect | required by contract; implementation conformance test still required | 🟡 REQUIRED / NOT PROVEN |

## Truth boundary

The canonical chain is:

```text
PROMISED
  ↓
IMPLEMENTED
  ↓
EXECUTED
  ↓
EXECUTION_VERIFIED
  ↓
SEMANTIC_VERIFIED (when required and independently proven)
  ↓
SIDE_EFFECT_VERIFIED (only when external effect has independent evidence)
```

A cryptographic proof establishes integrity/authorship of the evidence under its declared policy. It does not establish that the LLM answer is factually correct.

## Live evidence incorporated

The local MCP foundation server has demonstrated the path:

```text
MCP → Vortex → Ollama/Qwen → ExecutionProof → independent verification
```

The factual Canberra test succeeded. The 17-sheep test deliberately exposed the semantic boundary: the model produced `8`, while the proof remained valid. Therefore the proof system is functioning as an execution/evidence verifier, not yet as a universal semantic truth engine.

## Engineering rule

For mathematics, units, schemas, source code, tests, measurements and domain safety rules, use a deterministic or specialized verifier whenever one is available.

```text
LLM candidate
   ↓
VUA capability router
   ↓
specialized / deterministic verifier
   ↓
Vortex independent verification
   ↓
proof
```

The absence of a suitable verifier produces `NOT_PROVABLE`, not an implicit `PASS`.
