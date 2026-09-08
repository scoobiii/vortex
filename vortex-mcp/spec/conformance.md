> **GOS3** · Vortex Foundation conformance artifact

# Vortex MCP Conformance — v1

## 1. Conformance rule

Every normative `MUST` in the Vortex MCP specification MUST map to an executable test. A test matrix is the contract between specification, implementation, execution evidence, and CI.

The following are distinct states:

```text
SPECIFIED
  ≠ IMPLEMENTED
  ≠ TESTED
  ≠ CI PASS
  ≠ REAL INTEGRATION
  ≠ VERIFIED EVIDENCE
```

Therefore no implementation may claim Full Conformance from documentation, source existence, or a happy-path test alone.

## 2. Conformance levels

### Core

```text
MCP + request identity + authorization + ExecutionProof + verification contract
```

### Governed Execution

```text
Core + GOS3 + sandbox + bounded execution
```

### Cryptographic Execution

```text
Governed Execution + JCS + Ed25519 identity + key discovery + anti-replay
```

### Full Conformance

```text
MCP + GOS3 + Authorization + Sandbox + Execution + Proof +
Independent Verification + Cryptographic Identity + Anti-Replay +
Executable adversarial suite + real integration evidence + CI PASS
```

A conformance level MUST be claimed only after the corresponding matrix rows have executable evidence for the exact source revision.

## 3. Normative test matrix

| ID | Requirement | Required test | Required result |
|---|---|---|---|
| FND-001 | server/runtime starts under supported offline conditions | startup test | PASS |
| FND-002 | governance does not depend on a provider being reachable | offline governance test | PASS |
| FND-003 | Gateway execution remains a separate contract | MCP/Gateway contract test | PASS |
| FND-004 | request identity is preserved | identity propagation test | PASS |
| FND-005 | governance context is preserved | context propagation test | PASS |
| AUTH-001 | authorized operation reaches execution boundary | authorization allow test | PASS |
| AUTH-002 | denied operation never invokes connector | authorization deny test | PASS |
| AUTH-003 | capability escalation is denied | ESCALATE test | `POLICY_DENIED` |
| AUTH-004 | unauthorized operation does not execute | negative execution test | no connector invocation |
| AUTH-005 | credential scope is enforced | credential denial test | `CREDENTIAL_DENIED` |
| GOS3-001 | onboarded resource may execute when otherwise authorized | onboarding allow test | PASS |
| GOS3-002 | non-onboarded resource is rejected | onboarding deny test | `ONBOARD_REQUIRED` |
| GOS3-003 | pre-execution state is bound to governance evidence | GOS3 evidence test | PASS |
| GOS3-004 | post-execution change is detectable | post-change evidence test | mismatch detected |
| SBX-001 | in-scope filesystem operation is allowed | sandbox allow test | PASS |
| SBX-002 | external filesystem target is denied | sandbox deny test | `SANDBOX_DENIED` |
| SBX-003 | lexical `../` escape is denied | traversal test | `SANDBOX_DENIED` |
| SBX-004 | symlink escape is denied | symlink adversarial test | `SANDBOX_DENIED` |
| SBX-005 | sibling prefix is not treated as a descendant | prefix-boundary test | deny |
| GW-001 | Gateway authentication is enforced | Gateway auth test | PASS |
| GW-002 | request validation is enforced | validation test | PASS |
| GW-003 | connector/operation resolution is deterministic | resolution test | PASS |
| GW-004 | credentials are isolated | credential boundary test | secret never returned |
| GW-005 | real execution timeout is enforced | timeout test | `TIMEOUT`, `executed=true` |
| GW-006 | connector failure remains observable | failure test | `ERROR`, `executed=true` |
| GW-007 | execution proof is produced | proof test | valid proof |
| GW-008 | error mapping is deterministic | error-model tests | expected code |
| GW-009 | replay is rejected | replay test | `REPLAY_REJECTED` |
| PROOF-001 | input is hash committed | proof hash test | PASS |
| PROOF-002 | output is hash committed when available | proof hash test | PASS |
| PROOF-003 | request identity is committed | proof tamper test | verification fails |
| PROOF-004 | runtime identity is committed | proof tamper test | verification fails |
| PROOF-005 | execution state is committed | proof tamper test | verification fails |
| PROOF-006 | timing is committed | proof schema test | PASS |
| PROOF-007 | tampering is detectable | FORGE/TAMPER tests | verification fails |
| PROOF-008 | independent verification re-derives proof validity | verifier test | PASS |
| E2E-001 | MCP → Gateway → real filesystem execution | integrated E2E | real effect + proof |
| E2E-002 | MCP deny prevents Gateway execution | negative E2E | no effect |
| E2E-003 | MCP allow permits governed execution | allow E2E | effect + proof |
| E2E-004 | Gateway sandbox deny prevents effect | sandbox E2E | no effect |
| E2E-005 | credential denial prevents effect | credential E2E | no effect |
| E2E-006 | timeout remains observable | timeout E2E | `TIMEOUT` |
| E2E-007 | proof survives independent verification | verification E2E | PASS |
| E2E-008 | replay causes at most one real execution | replay E2E | one effect |
| GH-001 | MCP authorizes repository read | GitHub integration | PASS |
| GH-002 | Gateway resolves GitHub connector | GitHub integration | PASS |
| GH-003 | GitHub credential remains isolated | secret-boundary test | no leakage |
| GH-004 | real GitHub API operation executes | real provider test | provider result |
| GH-005 | real provider result is evidenced | proof integration | PASS |
| GH-006 | provider evidence is independently verifiable | verification integration | PASS |
| GH-007 | repository write outside policy is denied | escalation integration | `POLICY_DENIED` |
| GH-008 | provider failures are not masked | negative provider test | deterministic failure |

## 4. Adversarial classes

| Class | Attack | Required result |
|---|---|---|
| **FORGE** | mutate signed proof fields | signature verification fails |
| **REPLAY** | reuse consumed request/proof | replay rejection |
| **ESCALATE** | request capability beyond policy | `POLICY_DENIED` |
| **ESCAPE** | traverse/symlink outside sandbox or use unauthorized credential | `SANDBOX_DENIED` / credential denial |
| **TAMPER** | change artifact after execution | hash/evidence mismatch |

## 5. Current evidence

The repository currently has executable adversarial coverage for the MCP engine, including FORGE, REPLAY, ESCALATE, ESCAPE, and TAMPER scenarios. However, the exact full-suite evidence must be regenerated after dependency installation and after any source change; a previous `MODULE_NOT_FOUND` run is **not** a passing conformance result.

The last known Gateway local evidence on this branch is **68/68 PASS** with build PASS. That evidence belongs to the Gateway implementation and MUST NOT be copied into the MCP conformance claim.

## 6. Explicit gaps before Full Conformance

1. Complete MCP dependency install/build/test run on the exact revision.
2. Implement and execute the MCP → Gateway integrated E2E matrix.
3. Execute real GitHub connector tests with credential isolation and provider-side evidence.
4. Demonstrate independent verification across the integrated proof boundary.
5. Generate coverage evidence for the production code actually under test.
6. Run the complete matrix in CI and retain artifacts tied to the commit SHA.
7. Add k6 only **after** functional, conformance, integration, and CI gates are green.

## 7. Evidence chain

```text
commit SHA
  → dependency install
  → build
  → executable tests
  → coverage
  → real integration
  → ExecutionProof
  → independent verification
  → CI PASS
  → retained evidence artifact
```

## 8. Acceptance rule

```text
IMPLEMENTADO
+
TESTE EXECUTÁVEL
+
CI PASS
+
INTEGRAÇÃO REAL
+
EVIDÊNCIA
+
HASH / PROVENIÊNCIA
=
DONE
```

Missing any required item means **PARTIAL / NOT PROVEN**.
