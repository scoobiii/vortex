# Vortex MCP Specification v1

> Vortex is a protocol specification, not an implementation.
> An implementation is Vortex-conformant when it satisfies the normative
> requirements defined by this specification and passes the independent
> conformance suite.
> Vortex does not require a particular language, framework, runtime,
> model provider, cloud provider, or execution engine.

> Proof of execution is not proof of safety. Safety requires
> authorization, bounded execution, accountability, independent
> verification, and identity.

## 1. Thesis

```
SAFETY =
  AUTHORIZATION
+ BOUNDED EXECUTION
+ ACCOUNTABILITY
+ INDEPENDENT VERIFICATION
+ IDENTITY
```

No one of these properties may be inferred merely from the existence of
an MCP server. Each is independently specified and independently
testable (see `conformance.md`).

## 2. What Vortex MCP is

Vortex MCP is an **Execution Governance Profile** over the Model
Context Protocol (MCP). It specifies:

1. capability discovery,
2. operation requests,
3. authorization enforcement,
4. execution bounding (sandbox/limits),
5. execution identification,
6. cryptographic commitment of results,
7. evidence production (`ExecutionProof`),
8. third-party evidence verification,
9. cryptographic identity binding, and
10. rejection of replay, escalation, and tampering.

An implementation may be written in TypeScript, Java, Go, Rust, Python,
C#, or any other language. A server is Vortex-conformant **because it
satisfies this specification**, not because of what it is written in.

## 3. Relationship to MCP

```
LLM ──MCP──> [ Vortex MCP Profile ] ──> [ Authorization / Policy / Sandbox ]
                                              │
                                              ▼
                                     [ Execution Runtime ]
                                              │
                                              ▼
                                     [ Execution Proof ]
                                              │
                                              ▼
                                   [ Independent Verifier ]
```

MCP answers: *"how does an agent talk to a tool?"*
Vortex answers: *"under what conditions may that tool run, and how can
any third party verify what happened?"*

## 4. Normative pipeline

A Vortex-conformant server MUST treat every operation as:

```
REQUEST → IDENTITY → AUTHORIZATION → LIMITS → ONBOARD →
EXECUTION → PROOF → VERIFICATION
```

No step may be skipped for a mutating operation. See `authorization.md`,
`sandbox.md`, `gos3.md`, `execution-proof.md`, `verification.md`.

## 5. Operations

| kind          | side effect | proof required | notes                                   |
|---------------|-------------|-----------------|------------------------------------------|
| `inspect`     | no          | yes             | read-only                                |
| `propose`     | no          | yes             | describes intended change, never executes|
| `verify`      | no          | yes             | independent verification, see `verification.md` |
| `execute`     | yes (maybe) | yes             | authorization ≠ automatic execution      |
| `branch.write`| yes         | yes             | persistent state change; explicit policy required |

## 6. Non-goals

Vortex MCP does **not** mandate: a language, a framework (Express,
Fastify, Spring, …), a container technology (Docker, Kubernetes, WASM,
PRoot, …), an LLM provider, a database, or a cloud provider. It also
does not mandate that the *executor* itself be "Vortex" — only that it
satisfies the contract this specification defines.

## 7. Conformance levels

See `conformance.md` for the full definitions of **Core**, **Governed
Execution**, **Cryptographic Execution**, and **Full Conformance**.

## 8. Document map

```
spec/
├── vortex-mcp.md         (this document)
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
