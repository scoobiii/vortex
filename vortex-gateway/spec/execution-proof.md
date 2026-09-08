# Execution Proof

## Purpose

The Gateway MUST produce an `ExecutionProof` for every accepted or rejected invocation attempt. The proof records what the Gateway observed; it is not, by itself, proof that an external side effect occurred successfully.

```ts
interface ExecutionProof {
  proof_version: "vortex-gateway/1";
  request_id: string;
  connector_id: string;
  operation: string;
  executed: boolean;             // true iff connector.invoke() started
  status: ExecutionStatus;       // see error-model.md
  input_hash: string;            // sha256(canonical(input))
  output_hash: string | null;    // connector output when available
  started_at: string;            // ISO 8601
  completed_at: string;          // ISO 8601
  duration_ms: number;
  runtime_id: string;            // identifies this Gateway instance/process
  credential_id: string | null;  // never the secret itself
  proof_hash: string;            // sha256(canonical(proof body))
}
```

## `executed` semantics

`executed` MUST mean that connector invocation actually started. It MUST NOT mean that the connector succeeded and MUST NOT mean that an external side effect was confirmed.

- `executed: false`: the request was rejected before connector invocation.
- `executed: true, status: OK`: invocation completed successfully according to the connector contract.
- `executed: true, status: ERROR`: invocation started and the connector failed.
- `executed: true, status: TIMEOUT`: invocation started but exceeded the Gateway deadline.

For a timed-out invocation, the proof MUST NOT imply that the underlying external operation was rolled back. A timeout is an observation boundary, not a transaction rollback guarantee.

## Hashing and canonicalization

`input_hash`, `output_hash`, and `proof_hash` MUST use the deterministic canonicalization defined by the Gateway implementation. Object key order MUST NOT change the digest. Unsupported JSON values MUST be rejected rather than silently coerced.

The proof hash MUST commit to all proof fields except the `proof_hash` field itself. Changing `status`, `executed`, `request_id`, connector identity, timestamps, or committed hashes MUST invalidate integrity verification.

## Tamper evidence versus authenticity

`proof_hash` provides integrity/tamper evidence for the proof object. It is **not** a cryptographic signature and does not authenticate the issuer. A party capable of rewriting the proof can recompute the hash.

Cryptographic identity binding is specified at the Vortex MCP governance layer. Gateway deployments MUST NOT represent an unsigned `proof_hash` as equivalent to an Ed25519 signature.

## External side-effect boundary

An execution proof establishes what the Gateway invoked and what result it observed. It does not automatically establish that a remote provider committed the requested mutation. Strong side-effect proof requires provider-specific evidence or a higher-level validation record.

Where repository context exists, a caller MAY additionally carry repository state and change hashes in request metadata. Those hashes are outside the generic Gateway proof contract.

## Reference implementation

`src/proof.ts` (`buildProof`, `verifyProofIntegrity`).

## Conformance tests

`test/conformance/proof.test.ts` MUST cover proof integrity and tamper detection. `execution.test.ts` and `timeout.test.ts` MUST cover the relationship between invocation, `executed`, and `status`.

Current local evidence on `feat/mcp-server`: Gateway conformance is **68/68 PASS**. CI remains a separate acceptance gate.