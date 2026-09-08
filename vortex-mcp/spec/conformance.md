# Conformance — spec v1

## Levels

### Vortex MCP Core
```
MCP + request identity + authorization + ExecutionProof + verification
```
Minimum bar: every operation is authorized, produces a schema-valid,
verifiable `ExecutionProof` (signature MAY be a placeholder/unsigned
at this level only for bootstrapping — production deployments should
not stop here).

### Vortex Governed Execution
```
Core + GOS3 + sandbox + bounded execution
```
Adds resource onboarding and observable execution bounds
(`gos3.md`, `sandbox.md`).

### Vortex Cryptographic Execution
```
Governed Execution + cryptographic identity + JCS + Ed25519 +
key discovery + anti-replay
```
Adds real signatures, canonicalization, and replay rejection
(`identity.md`, `anti-replay.md`, `key-discovery.md`).

### Vortex Full Conformance
```
MCP + GOS3 + Authorization + Sandbox + Execution + Proof +
Independent Verification + Cryptographic Identity + Anti-Replay +
Conformance Tests
```
All of the above, plus passing the adversarial suite below.

## Adversarial Conformance Suite

A "happy path only" test is not sufficient. Conformance is measured by
resistance to five adversarial classes:

| class      | attempt                                              | required result       |
|------------|-------------------------------------------------------|------------------------|
| **FORGE**    | modify `output_hash`, `executed`, `request_id`, `agent_id`, or `policy_id` after signing | signature verification fails |
| **REPLAY**   | resubmit a consumed `request_id` or an already-verified proof | `REPLAY_REJECTED` |
| **ESCALATE** | request a capability/scope beyond what policy allows (e.g. `repository.write` when only `repository.read` is permitted) | `POLICY_DENIED` |
| **ESCAPE**   | write outside `filesystem_scope`, use an unauthorized credential, or open an unauthorized network connection | `SANDBOX_DENIED` |
| **TAMPER**   | modify the artifact on disk after execution, bypassing the connector | re-hashed artifact no longer matches the proof's `output_hash` |

The reference implementation's `test/conformance/*.test.ts` implements
exactly these five classes and MUST pass before any claim of
conformance is made. A `vortex-mcp-<lang>` port in another language
MUST reproduce equivalent tests against its own engine and, ideally,
verify proofs produced by *this* reference implementation's
`vortex-verifier` (and vice versa) to demonstrate interoperability.

## Security matrix

|                     | Evidência alta                  | Evidência baixa      |
|---------------------|----------------------------------|------------------------|
| **Segurança alta**  | Vortex / Verifiable Agent         | Black-box Guard        |
| **Segurança baixa** | Audit Theater                     | Blind Agent            |

A system with extensive logging but no effective authorization is not
safe (Audit Theater). A system with strong blocking but no
independently-verifiable evidence is not verifiable (Black-box Guard).
Vortex targets the top-left quadrant.
