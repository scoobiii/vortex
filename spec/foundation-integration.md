# Vortex Foundation Integration Specification v1

## 1. Purpose

This document defines the integration boundary between **Vortex MCP (governance plane)** and **Vortex Gateway (execution plane)**.

It is intentionally separate from the individual component specifications. Component conformance MUST NOT be interpreted as integrated conformance.

```text
MCP CONFORMANCE
      +
GATEWAY CONFORMANCE
      +
REAL INTEGRATION
      +
INDEPENDENT VERIFICATION
      =
FOUNDATION CONFORMANCE
```

## 2. Contract boundary

```text
AGENT
  ↓
VORTEX MCP
  identity / authorization / GOS3 / sandbox / governance
  ↓ governed InvokeRequest
VORTEX GATEWAY
  authentication / validation / credential boundary /
  connector resolution / timeout / execution / observation
  ↓
CONNECTOR / RUNTIME
```

MCP owns governance decisions. Gateway owns controlled execution. Neither layer may silently replace the other's contract.

## 3. Required propagation

The governed request MUST preserve, where applicable:

- `request_id`;
- `agent_id`;
- `principal_id`;
- `policy_id` and `policy_version`;
- `gos3_session_id`;
- `sandbox_id`;
- requested capability/scope;
- connector identifier;
- operation;
- input and input hash context;
- credential reference, never the secret value.

A loss or unauthorized mutation of governance context MUST be observable and MUST fail the relevant integration test.

## 4. Execution semantics

The integrated system MUST preserve the Gateway rule:

> `executed=true` means the connector invocation started; it does not mean the invocation succeeded or that a remote side effect was confirmed.

Therefore:

```text
MCP DENY
  → Gateway NOT invoked
  → no connector effect

MCP ALLOW + Gateway DENY
  → connector NOT invoked
  → no connector effect

MCP ALLOW + Gateway EXECUTE
  → connector invoked
  → executed=true
  → outcome observed
  → proof/evidence produced
```

Timeout and connector failure MUST remain observable. They MUST NOT be converted into false success or false `executed=false`.

## 5. Required integration tests

| ID | Scenario | Required evidence |
|---|---|---|
| E2E-001 | MCP → Gateway → real filesystem write | real artifact + proof |
| E2E-002 | MCP policy deny | Gateway not invoked + no effect |
| E2E-003 | MCP allow | Gateway executes + proof |
| E2E-004 | Gateway sandbox deny | no external effect |
| E2E-005 | credential scope deny | secret not exposed + no execution |
| E2E-006 | real connector timeout | `TIMEOUT`, `executed=true` |
| E2E-007 | proof independent verification | verifier PASS |
| E2E-008 | replay under concurrency | at most one real effect |
| E2E-009 | post-execution tamper | verification/hash mismatch |
| E2E-010 | governance context propagation | exact context preserved |

These tests are **required targets**. They are not evidence merely because they are listed in this document.

## 6. Filesystem security

The integration suite MUST include real filesystem checks for:

- lexical traversal (`../`);
- sibling prefix collisions;
- symlink to an external file;
- symlinked directory to an external tree;
- write to an external target through a symlink;
- read from an external target through a symlink.

The external target MUST remain untouched when the operation is denied.

## 7. Proof chain

The integrated evidence chain is:

```text
source commit
  ↓
MCP governance decision
  ↓
InvokeRequest
  ↓
Gateway execution
  ↓
connector result / real artifact
  ↓
ExecutionProof
  ↓
independent verification
  ↓
CI artifact
```

The proof MUST preserve provenance back to the exact source revision. A human-readable statement such as "executed successfully" is not sufficient evidence.

## 8. Provider integrations

GitHub, Qwen, Ollama, or another provider MUST be tested as real integrations before being claimed as real execution.

Provider-specific proof MUST distinguish:

1. Gateway invoked the provider;
2. provider returned a successful response;
3. the intended external side effect was actually committed;
4. the resulting state can be independently verified.

These are separate claims.

## 9. Coverage and CI

The integration gate MUST run against the exact commit under evaluation and MUST retain:

- build output;
- unit/conformance test output;
- integration test output;
- coverage report;
- execution proof/evidence artifacts;
- provenance/hash values;
- CI run identity.

No `continue-on-error`, `|| true`, silent test skipping, or fake provider response may be used to manufacture a green gate.

## 10. k6 gate

k6 performance testing is downstream of functional conformance:

```text
SPEC MATRIX
→ EXECUTABLE TESTS
→ FIX FAILURES
→ COVERAGE
→ REAL INTEGRATION
→ INDEPENDENT VERIFICATION
→ CI PASS
→ k6 SMOKE/LOAD/STRESS/SOAK
```

Performance results MUST NOT be used to compensate for functional, security, provenance, or verification failures.

## 11. Acceptance rule

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

Anything missing is **PARTIAL / NOT PROVEN**.
