> **GOS3** · agente: `GPT` · papel: `Maintainer / Engineering Agent`
> fase: `S0 — Baseline Verification` · data: `2026-09-06`
> antes: S0 precisava de uma prova reprodutível local + CI online consolidada
> depois: baseline validado no SHA `e16352acd997da8bdc71cb8cd97f4f477183ce6c`; runtime code unchanged; dívida de prova de side-effect permanece explícita

# S0 — Baseline Verification

**Status:** GREEN  
**Validated commit:** `e16352acd997da8bdc71cb8cd97f4f477183ce6c`  
**Validation date:** 2026-09-06

## Purpose

S0 establishes a reproducible baseline for the Vortex invocation contract and the existing Grok adapter. It verifies the code already published on `main`; S0 itself does not introduce runtime behavior.

## What was changed for S0

No Vortex runtime or test code was changed to obtain this result.

The validation was performed against the already-published commit above using a fresh clone and GitHub Actions.

## Fresh-clone validation

Repository cloned into an isolated workspace (`~/vortex-s0`).

Observed state:

- branch: `main`
- tracking: `origin/main`
- working tree: clean
- `HEAD`: `e16352acd997da8bdc71cb8cd97f4f477183ce6c`

Commands executed:

```bash
npm ci
python3 tests/contract_test.py
npm run test:grok
```

Results:

- `npm ci`: completed successfully; 20 packages added; 0 vulnerabilities reported.
- contract tests: PASS.
- Grok adapter tests: `19 passed, 0 failed`.

## Contract gate evidence

The contract test suite exercised both accepted and rejected cases:

- valid `executed=true`: accepted;
- valid `executed=false`: accepted;
- `executed=true` without `evidence_hash`: rejected;
- forged `evidence_hash`: rejected.

The gate therefore verifies that an execution claim requires matching evidence under the current v0.1 contract validation.

## Online CI validation

GitHub Actions was inspected for the same commit.

Workflow runs:

- `34047536074` — `gos3-compliance`: success
- `34047536129` — `GOS3 Compliance + Snapshot`: success

The `contract-gate` job explicitly executed:

```text
python3 tests/contract_test.py
```

The online log contains the contract-test execution and successful validation of the test cases. The CI checkout also resolved the exact validated SHA:

```text
e16352acd997da8bdc71cb8cd97f4f477183ce6c
```

The header/governance check completed successfully, and the publish workflow generated and pushed the corresponding snapshot to `gh-pages`.

## S0 gates

| Gate | Result |
|---|---|
| Fresh clone | PASS |
| Exact remote commit | PASS |
| Clean dependency install | PASS |
| Local contract gate | PASS |
| Local Grok conformance | PASS — 19/19 |
| Online contract execution | PASS |
| Header/governance CI | PASS |
| Snapshot publication | PASS |

## Scope boundary

S0 does **not** establish that Vortex is complete or that every `executed=true` claim proves an external side-effect.

Known remaining debt:

> `executed:true` must ultimately be backed by observed execution effects, receipt/provenance, and evidence sufficient to distinguish a real side-effect from a merely constructed response.

That is a subsequent runtime-proof task and is not silently marked complete by S0.

## Conclusion

**S0 baseline: GREEN.**

The existing published baseline is reproducible from a clean clone and its contract gate is executed successfully online by GitHub Actions. No runtime code was changed as part of this S0 validation.
