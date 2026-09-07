<!-- Vortex / GOS3 v2.4 — VUA Contract -->
<!-- Rule: mexeu → testa → valida → publica. -->
# VUA — Vortex Universal Adapter

## Purpose

VUA is the universal adaptation layer between agents/protocols and Vortex-controlled execution environments. It is not itself an environment adapter and it is not MCP.

```text
LLM / Agent
   │
 MCP / API / CLI
   │
   ▼
  VUA
   │
 Vortex protocol + policy + proof
   │
 ├── GitHub Adapter
 ├── Rhino Adapter
 ├── Mobile Client/Adapter
 ├── Blender Adapter
 └── future VM / Docker / Kubernetes adapters
```

## Contract

`UniversalAdapter<TProposal>` defines:

- identity and version;
- capabilities and security properties;
- request validation;
- controlled execution;
- execution result and evidence.

`BaseUniversalAdapter` prevents `execute()` from bypassing validation.

## MCP boundary

MCP is an interoperability protocol for exposing tools/resources to agents. VUA can expose registered Vortex capabilities through an MCP bridge without moving MCP-specific policy into Vortex Core.

The current `RegistryMcpBridge` provides the mapping:

`adapter.capability → MCP tool → ExecutionRequest → VUA adapter`.

A production MCP server transport remains a separate integration task; this bridge is the domain boundary and is intentionally transport-neutral.

## Registry

`AdapterRegistry` provides deterministic registration, lookup and catalog discovery. Duplicate adapter IDs and unknown adapter IDs are rejected.

## Execution Proof

`createExecutionProof()` binds request, result, repository state hash and change hash into a SHA-256 proof record. The local-first canonical JSON utility remains the canonicalization implementation used by the wider Vortex runtime.

## Security model

- capabilities are explicit;
- destructive capabilities require `context.allowDestructive === true` at the base validation layer;
- adapter validation is mandatory before execution;
- the VUA layer does not grant host privileges by itself;
- physical execution remains controlled by the host/adapter;
- credentials and tokens must not be embedded in proposals or proofs.

## Current adapter inventory

| Component | Role | Status |
|---|---|---|
| GitHub | Git/PR/CI control-plane adapter | Implemented |
| Rhino | CAD/NURBS proposal adapter | Implemented |
| VUA | Universal adapter contract + registry | Implemented in this change |
| MCP bridge | Agent-to-VUA domain bridge | Implemented in this change |
| Android/iOS | Mobile client/transport | Next |
| Rhino physical bridge | Real Rhino process integration | Next |
| Blender | 3D/DCC adapter | Next |
| Desktop gateway | Local/network gateway | Next |
| VM/Docker/Kubernetes | Remote execution adapters | Future |

## Design rule

Do not create one-off protocol logic inside each environment adapter. New environments implement the VUA contract; transports and agent protocols remain separate concerns.
