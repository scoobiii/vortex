> **GOS3** · Vortex Foundation conformance artifact

# Execution Proof — Vortex MCP v1

`ExecutionProof` is the accountability artifact of Vortex MCP. It records the governed request, execution identity, observed outcome, hashes, and cryptographic identity binding.

## 1. Minimal schema

```json
{
  "proof_version": "1",
  "request_id": "...",
  "execution_id": "...",
  "runtime_id": "...",
  "agent_id": "...",
  "principal_id": "...",
  "connector_id": "...",
  "operation": "...",
  "executed": true,
  "status": "success",
  "input_hash": "sha256:...",
  "output_hash": "sha256:...",
  "started_at": "...",
  "completed_at": "...",
  "duration_ms": 1234,
  "policy_id": "...",
  "policy_version": "...",
  "gos3_session_id": "...",
  "sandbox_id": "...",
  "identity": { "key_id": "...", "algorithm": "Ed25519" },
  "signature": "..."
}
```

All signed fields MUST be covered by the Ed25519 signature. `input_hash` and `output_hash` MUST be derived from deterministic JCS canonicalization of the relevant values.

## 2. `executed` invariant

`executed` means **whether execution actually started**, not whether execution succeeded.

| Condition | `executed` | Status |
|---|---:|---|
| Connector/runtime invocation starts and succeeds | `true` | success / OK |
| Invocation starts and fails | `true` | ERROR |
| Invocation starts and exceeds deadline | `true` | TIMEOUT |
| Policy/auth/GOS3/sandbox/replay rejection before invocation | `false` | specific denial |

A conformant implementation MUST NOT set `executed: false` merely because an execution failed or timed out.

`executed: true` also MUST NOT be interpreted as proof that an external provider committed a side effect. It proves only that the execution boundary was entered; provider-specific confirmation requires additional evidence.

## 3. Rejection proofs

A request rejected before execution MUST remain an accountable event. If the implementation's proof contract emits a proof for the rejection, `executed` MUST be `false` and the specific denial status MUST be preserved. Implementations MUST NOT collapse `POLICY_DENIED`, `SANDBOX_DENIED`, `ONBOARD_REQUIRED`, and `REPLAY_REJECTED` into a generic failure.

If a deployment chooses not to emit proofs for an early protocol-layer rejection, that behavior MUST be explicitly specified by its conformance profile rather than silently counted as execution evidence.

## 4. Canonicalization and signing

The signable representation is the JCS canonicalization of the proof body with `signature` removed. Ed25519 is mandatory for **Cryptographic Execution** and **Full Conformance**.

Verification MUST independently reconstruct the canonical bytes and validate the signature using the discovered public key. A verifier MUST NOT trust a hash or status supplied by the executor without recomputation.

## 5. Tamper and provenance

Changing any signed field — including `request_id`, `agent_id`, `policy_id`, `sandbox_id`, `executed`, `status`, `input_hash`, `output_hash`, or identity metadata — MUST invalidate the signature.

For filesystem or repository artifacts, the proof's `output_hash` is meaningful only for the exact artifact representation covered by the hashing procedure. A later mutation MUST be detectable when the verifier re-hashes the same artifact.

## 6. Relationship with Gateway

When MCP delegates execution to Vortex Gateway, the MCP proof MUST preserve the governed request identity and relevant governance context. Gateway's `proof_hash` is an execution-boundary integrity mechanism; it MUST NOT be treated as a replacement for MCP's Ed25519 identity binding.

The integrated proof chain is:

```text
MCP governance
  → governed InvokeRequest
  → Gateway execution
  → Gateway observation/proof
  → MCP evidence binding
  → independent verification
```

## 7. Reference implementation and tests

Reference implementation: `vortex-mcp/src/proof.ts`, `src/identity.ts`, and `src/verifier.ts`.

Conformance tests MUST include FORGE, REPLAY, ESCALATE, ESCAPE, and TAMPER cases and MUST be run against the exact source revision being claimed.