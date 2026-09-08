# Conformance

## Principle

Every normative MUST in this specification has a dedicated,
independently-runnable test. "Passing 100% of `npm test`" is not treated
as equivalent to "conformant" unless the matrix below is actually
complete — this document exists so that gap is checkable, not assumed.

## Matrix: spec ↔ code ↔ test ↔ evidence

| Requirement | Spec doc | Code | Test file | Evidence (this run) |
|---|---|---|---|---|
| Authentication | `authentication.md` | `src/auth.ts` | `auth.test.ts` | 7/7 pass |
| Structural validation | `validation.md` | `src/validate.ts` | `validate.test.ts` | 10/10 pass |
| Connector resolution | `connector.md` | `src/connector-registry.ts` | `resolve.test.ts` | 5/5 pass |
| Connector contract (reference) | `connector.md` | `src/connectors/filesystem.ts` | `filesystem-connector.test.ts` | 7/7 pass |
| Credential boundary + scope | `credentials.md` | `src/credential-broker.ts` | `credential.test.ts` | 10/10 pass |
| Timeout + cancellation | `timeout.md` | `src/executor.ts` | `timeout.test.ts` | 6/6 pass |
| Execution + `executed` invariant | `execution.md` | `src/gateway.ts` | `execution.test.ts` | 3/3 pass |
| Execution proof + tamper evidence | `execution-proof.md` | `src/proof.ts` | `proof.test.ts` | 7/7 pass |
| Canonicalization | `execution-proof.md` (referenced) | `src/canonicalize.ts` | `canonicalize.test.ts` | 8/8 pass |
| Error model | `error-model.md` | `src/types.ts`, `src/errors.ts` | cross-cutting, see above | — |
| Full pipeline (e2e) | `vortex-gateway.md` §2 | `src/gateway.ts` | `e2e.test.ts` | 3/3 pass |

Total, this run: **66/66 tests pass**, **100% line / 100% branch /
100% function coverage** on every file under `src/` (measured with
Node's built-in `--experimental-test-coverage`, not estimated).

## What conformance here does NOT claim

Consistent with the honest-gap discipline already applied to the parent
Vortex MCP audit in this project:

1. **No independent verifier.** This package produces proofs; it does
   not ship a separate verifier process that re-derives a proof from a
   live artifact without trusting the Gateway process that produced it.
   That is Vortex MCP's `verification.md` concern, one layer up.
2. **No signature.** `proof_hash` is tamper-evident (see
   `execution-proof.md`) but not cryptographically bound to an identity.
   Signing belongs to whichever layer has the signing key — this Gateway
   does not generate or hold one.
3. **No repository/VCS awareness.** `repository_state_hash` and
   `change_hash` from the broader three-hash design are out of scope
   here (see `execution-proof.md` §"Relationship to the broader
   three-hash design").
4. **Reference connector only.** `FilesystemConnector` proves the
   contract; there is no GitHub connector, no Qwen/GPT/Claude adapter in
   this package. Building one is a thin, separate exercise once the
   Gateway contract itself is trusted.
5. **Reference auth only.** `StaticTokenAuthenticator` is explicitly not
   a production authentication mechanism (see `authentication.md`).
6. **In-memory only.** There is no persistence layer for issued
   credentials, proofs, or audit trail — a restart loses Gateway process
   state (registries are re-constructed by whoever embeds the Gateway).
   This mirrors a gap already flagged in the parent Vortex Universal
   Connector audit ("proposals ficam apenas em Map").

## Reproducing this evidence

```
npm install   # or: skip — zero runtime dependencies, only devDependencies
npm run build
npm run test:conformance      # 66/66
npm run test:coverage         # 100/100/100 on src/**
```
