> **GOS3** · Vortex Foundation conformance artifact

# Vortex MCP Specification v1

> Vortex MCP is the governance profile over MCP. It is a protocol contract, not a claim that every reference handler is already implemented.

> **Proof of execution is not proof of safety.** Safety requires authorization, bounded execution, accountability, independent verification, and identity.

## 1. Thesis

```text
SAFETY =
  AUTHORIZATION
+ BOUNDED EXECUTION
+ ACCOUNTABILITY
+ INDEPENDENT VERIFICATION
+ IDENTITY
```

These properties are independent obligations. The existence of an MCP server, a log entry, an execution flag, or a hash MUST NOT be treated as evidence of all five.

## 2. Scope

Vortex MCP specifies the governance boundary around an MCP tool invocation:

1. request identity;
2. capability and operation authorization;
3. GOS3 resource onboarding;
4. sandbox and execution limits;
5. connector/executor invocation contract;
6. execution identification and accountability;
7. canonical result hashing;
8. cryptographic identity binding;
9. independent evidence verification;
10. anti-replay enforcement;
11. escalation, sandbox-escape, and tamper rejection.

The reference implementation in `vortex-mcp/src/` is the implementation under conformance evaluation. A language port is conformant only when its executable behavior satisfies this specification and its own conformance suite.

## 3. Relationship to MCP and Gateway

```text
AGENT / LLM
     │ MCP
     ▼
┌───────────────────────────┐
│ VORTEX MCP                │
│ Governance plane          │
│ identity / policy / GOS3  │
│ sandbox / authorization   │
└─────────────┬─────────────┘
              │ governed InvokeRequest
              ▼
┌───────────────────────────┐
│ VORTEX GATEWAY            │
│ Execution boundary        │
│ auth / validation         │
│ credentials / connector   │
│ timeout / observation     │
│ execution proof           │
└─────────────┬─────────────┘
              ▼
        CONNECTOR / RUNTIME
```

MCP answers **whether and under which governance conditions an operation may be requested**. Gateway answers **how the governed request is executed within its execution contract**.

Gateway MUST NOT silently become a second MCP governance implementation. MCP MUST NOT assume that Gateway execution success proves a provider-side effect.

## 4. Normative pipeline

For a mutating operation, a conformant implementation MUST enforce:

```text
REQUEST
  → IDENTITY
  → AUTHORIZATION / POLICY
  → GOS3 ONBOARDING
  → SANDBOX / LIMITS
  → EXECUTION
  → EXECUTION PROOF
  → INDEPENDENT VERIFICATION
```

A rejection before execution MUST NOT invoke the connector. A connector invocation that starts MUST be represented as execution (`executed: true`) even when the final status is an error or timeout. See `execution-proof.md` for the MCP proof contract and `anti-replay.md` for replay semantics.

## 5. Operations

| Operation | Side effect | Governance | Proof | Current reference status |
|---|---:|---|---|---|
| `inspect` | no | required | required | contract / handler status tracked by tests |
| `propose` | no | required | required | contract / handler status tracked by tests |
| `verify` | no | required | required | verifier contract implemented; integration tracked separately |
| `execute` | possible | required | required | engine contract implemented; end-to-end handler integration remains a tracked gap |
| `branch.write` | yes | explicit write authorization + onboarding + sandbox | required | normative operation; provider integration tracked separately |

Authorization is not execution. Proposal is not execution. Execution is not proof of external side-effect success.

## 6. Identity and proof

Vortex Cryptographic Execution uses **Ed25519** identity binding and JCS canonicalization. The signature covers the canonical proof body and binds the declared identity to the evidence. See `identity.md`, `key-discovery.md`, and `execution-proof.md`.

The reference MCP implementation MUST NOT substitute an unsigned hash or HMAC for the Ed25519 identity requirement at the cryptographic conformance level.

## 7. Security invariants

The following are normative security properties:

- a request outside an authorized capability/scope MUST be denied;
- a non-onboarded governed resource MUST NOT execute a governed operation;
- a filesystem target outside the sandbox MUST be denied, including symlink and prefix-boundary escapes;
- credentials MUST remain behind the credential boundary and outside agent-visible results;
- a consumed `request_id` MUST NOT be executed twice;
- a proof whose signed fields are modified MUST fail verification;
- post-execution artifact changes MUST be detectable when artifact hashing is part of the proof;
- failures and timeouts MUST remain observable and MUST NOT be converted into false success.

## 8. Non-goals

Vortex MCP does not mandate a programming language, framework, container runtime, cloud, model provider, database, or particular transport beyond the MCP-facing protocol contract. It does not require Qwen, VUA, or any specific model runtime.

**Qwen remains a functional runtime. VUA remains P&D/experimental and MUST NOT be introduced into the Qwen production execution path by this specification.**

## 9. Conformance

See `conformance.md` for the normative matrix, adversarial classes, current implementation evidence, and explicit gaps. A green unit suite alone does not establish Full Conformance.

## 10. Document map

```text
spec/
├── vortex-mcp.md
├── execution-proof.md
├── authorization.md
├── sandbox.md
├── gos3.md
├── identity.md
├── key-discovery.md
├── anti-replay.md
├── verification.md
└── conformance.md
```
