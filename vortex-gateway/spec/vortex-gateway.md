# Vortex Gateway Specification v1

> Vortex Gateway is the controlled execution boundary between governed
> requests and external or local capabilities.

> Gateway execution is not authorization by itself.

## 1. Relationship to Vortex MCP

Vortex MCP and Vortex Gateway are two different contracts, deliberately
kept separate:

```
AGENT
  │
  │ MCP
  ▼
VORTEX MCP            (governance: policy, GOS3, sandbox, identity)
  │
  │ governed invocation (InvokeRequest)
  ▼
VORTEX GATEWAY         (execution boundary: auth, validation, credentials,
  │                     connector resolution, timeout, proof)
  │
  ▼
CONNECTOR              (GitHub, filesystem, Qwen runtime, ...)
```

- **MCP answers:** "under what conditions may an agent ask for something,
  and is that agent who it claims to be?"
- **Gateway answers:** "given an already-governed request, how is it
  executed safely, and how can any third party verify what happened?"

The Gateway does **not** re-implement policy, GOS3 onboarding, or agent
identity — those are Vortex MCP's job. The Gateway does not know why a
request was allowed to reach it; it only knows how to execute it safely
and prove what it did.

## 2. Normative pipeline

Every `InvokeRequest` MUST be treated as:

```
REQUEST
  → AUTHENTICATION
  → VALIDATION
  → CAPABILITY / CONNECTOR RESOLUTION
  → CREDENTIAL BOUNDARY
  → EXECUTION (bounded by timeout)
  → OBSERVATION
  → EXECUTION PROOF
```

No step may be skipped. A proof is produced for **every** outcome,
including rejections — see `execution-proof.md`.

## 3. Responsibilities

| Capability                          | Gateway                     |
|--------------------------------------|------------------------------|
| Receive request                      | MUST                         |
| Authenticate caller                  | MUST                         |
| Validate request                     | MUST                         |
| Resolve connector + operation        | MUST                         |
| Isolate credentials                  | MUST                         |
| Apply timeout                        | MUST                         |
| Execute connector                    | MUST                         |
| Observe result                       | MUST                         |
| Produce ExecutionProof               | MUST                         |
| Identify runtime                     | MUST                         |
| Hash input                           | MUST                         |
| Hash output                          | MUST                         |
| Never expose credential to caller/LLM| MUST                         |
| Independent verification             | NOT the Gateway's job (MCP/verifier) |
| High-level policy (GOS3, scopes)     | NOT necessarily              |
| MCP transport                        | NOT the Gateway's job        |
| GitHub / Qwen / any provider logic   | connector, not Gateway       |

## 4. Non-goals

The Gateway does not mandate a transport (HTTP, stdio, MCP), a specific
authentication mechanism (mTLS, OIDC, static token), or a specific
connector implementation. It mandates the pipeline above and the
contracts in `invocation.md` and `execution-proof.md`.

## 5. Reference implementation

This repository (`src/`) is a Vortex-Gateway-conformant reference
implementation in TypeScript, with zero runtime dependencies, tested
against the conformance suite described in `conformance.md`.

See also: `invocation.md`, `authentication.md`, `validation.md`,
`connector.md`, `credentials.md`, `execution.md`, `execution-proof.md`,
`timeout.md`, `error-model.md`, `conformance.md`.
