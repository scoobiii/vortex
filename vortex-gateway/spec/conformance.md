# Vortex Gateway Conformance — v1

## Principle

Every normative MUST in the Gateway specification MUST map to an executable test. A passing test suite is evidence of the tested contract; it is not permission to claim capabilities that are not implemented or independently verified.

## Current executable matrix

| Requirement | Spec | Implementation | Tests | Current evidence |
|---|---|---|---|---|
| Authentication | `authentication.md` | `src/auth.ts` | `auth.test.ts` | PASS |
| Structural validation | `validation.md` | `src/validate.ts` | `validate.test.ts` | PASS |
| Connector resolution | `connector.md` | `src/connector-registry.ts` | `resolve.test.ts` | PASS |
| Filesystem connector contract | `connector.md` | `src/connectors/filesystem.ts` | `filesystem-connector.test.ts` | PASS |
| Credential boundary + scope | `credentials.md` | `src/credential-broker.ts` | `credential.test.ts` | PASS |
| Timeout + cancellation | `timeout.md` | `src/executor.ts` | `timeout.test.ts` | PASS |
| Execution + `executed` invariant | `execution.md` | `src/gateway.ts` | `execution.test.ts` | PASS |
| Execution proof + integrity | `execution-proof.md` | `src/proof.ts` | `proof.test.ts` | PASS |
| Canonicalization | `execution-proof.md` | `src/canonicalize.ts` | `canonicalize.test.ts` | PASS |
| Error model | `error-model.md` | `src/types.ts`, `src/errors.ts` | cross-cutting | PASS where exercised |
| Full Gateway pipeline | `vortex-gateway.md` | `src/gateway.ts` | `e2e.test.ts` | PASS |
| Symlink sandbox escape | `connector.md` / sandbox boundary | `src/connectors/filesystem.ts` | `filesystem-connector.test.ts` | PASS |

## Local evidence

The current local Gateway run on `feat/mcp-server` is:

```text
npm run build
PASS

npm run test:conformance
68 tests
68 pass
0 fail
```

The 68-test run explicitly covers connector failure with `executed: true`, real timeout with `executed: true`, symlink escape on read/write, and prefix-boundary sandbox checks.

This section is **local evidence**, not a CI claim. CI status MUST be read from the corresponding GitHub Actions run for the exact commit.

## Security and scope gaps

The following are deliberately recorded as gaps rather than hidden behind a green aggregate:

1. **Gateway-level anti-replay:** a direct Gateway caller requires an atomic `request_id` reservation policy. See repository issue #59. MCP-level replay protection does not automatically prove defense-in-depth at Gateway ingress.
2. **Independent verifier:** Gateway integrity verification is local to the Gateway proof contract. Independent verification belongs to the MCP/governance layer until a separate Gateway verifier is implemented.
3. **Cryptographic signature:** Gateway `proof_hash` is tamper-evident but unsigned. It MUST NOT be described as equivalent to the MCP Ed25519 identity signature.
4. **Provider side-effect proof:** a successful connector invocation is not proof that a remote provider committed the requested mutation.
5. **Persistence:** the reference Gateway keeps runtime state in memory; restart persistence and durable audit storage are not part of this v1 reference implementation.
6. **Provider connectors:** the reference Gateway's conformance suite proves the filesystem connector contract. GitHub/Qwen/provider-specific integration requires separate real integration tests.

## Conformance claim

The Gateway can claim **local test conformance for the implemented reference contract** only when the exact source revision has a passing build and conformance suite. It MUST NOT claim production readiness, independent trust, durable auditability, or real provider side-effect verification from these tests alone.

## Required evidence chain

```text
source revision
  → build
  → executable conformance suite
  → coverage
  → real integration (where claimed)
  → ExecutionProof
  → independent verification (where claimed)
  → CI artifact
```

The repository acceptance rule is:

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

Missing evidence means **PARTIAL / NOT PROVEN**, not DONE.