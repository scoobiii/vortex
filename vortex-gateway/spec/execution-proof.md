# Execution Proof

## Requirement

The Gateway MUST produce an `ExecutionProof` for **every** request,
including every rejection. A proof is never optional and never withheld
— `"eu rodei e funcionou"` is not a valid claim; only a hash-committed
record is.

```ts
interface ExecutionProof {
  proof_version: "vortex-gateway/1";
  request_id: string;
  connector_id: string;
  operation: string;
  executed: boolean;             // true iff status === "OK"
  status: ExecutionStatus;       // see error-model.md
  input_hash: string;            // "sha256:" + sha256(canonical(input))
  output_hash: string | null;    // null unless executed
  started_at: string;            // ISO 8601
  completed_at: string;          // ISO 8601
  duration_ms: number;
  runtime_id: string;            // identifies this Gateway instance/process
  credential_id: string | null;  // never the secret itself
  proof_hash: string;            // "sha256:" + sha256(canonical(rest of the proof))
}
```

## Canonicalization

`input_hash` / `output_hash` / `proof_hash` are all derived from a
deterministic JSON canonicalization (object keys sorted recursively, no
whitespace) — not from `JSON.stringify` directly, whose key order is
insertion-dependent. Two structurally identical values MUST always hash
identically regardless of how they were constructed. Values with no
JSON representation (`undefined`, functions, symbols, bigints,
non-finite numbers) are rejected outright rather than silently coerced,
because a silent coercion would make the hash lie about what was
actually committed. See `src/canonicalize.ts`.

## Tamper evidence

`proof_hash` is a self-referential hash over the rest of the proof body.
`verifyProofIntegrity(proof)` recomputes it and compares — mutating any
single field (including `status`, `executed`, or the hashes themselves)
invalidates it. This is **not a substitute for a signature**: it detects
accidental or naive tampering of a proof object in memory/transit, but
anyone who can recompute `proof_hash` correctly after editing the body
can still forge a "self-consistent" proof. Binding a proof to an
identity that cannot be forged (Ed25519 signature over the canonical
body, as `identity.md` does at the Vortex MCP layer) is explicitly **out
of the Gateway's normative scope** — the Gateway commits to *what
happened*; an upstream layer is responsible for committing to *who
vouches for it*.

## Relationship to the broader three-hash design

A separate, more ambitious design (shared during this project's
architecture discussion) proposes three distinct hashes rolled into a
`Vortex Validation Record`: `repository_state_hash` (repo state the
agent worked from), `execution_proof_hash` (this document's proof),
and `change_hash` (the normalized patch/diff). This Gateway
implements only the middle one — `execution_proof_hash`, here called
simply `proof_hash`/the proof as a whole. `repository_state_hash` and
`change_hash` are **not implemented here** because they require
repository/VCS context (a base commit, a diff) that a generic Gateway
invocation (which might target a filesystem, not a Git repo) does not
inherently have. A caller (e.g. a GitHub connector, or Vortex MCP itself)
that has that context can compute and carry those two hashes in
`InvokeRequest.metadata`, and combine them with this proof's `proof_hash`
into the fuller Validation Record — that composition is intentionally
left to the caller rather than hard-coded into the Gateway.

## Reference implementation

`src/proof.ts` (`buildProof`, `verifyProofIntegrity`).

## Conformance tests

`test/conformance/proof.test.ts` (including a dedicated `TAMPER` test
that mutates every single field of a proof and checks
`verifyProofIntegrity` catches each one).
