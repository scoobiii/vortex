# Vortex Gateway

Reference implementation of the **Vortex Gateway Specification v1** — the
controlled execution boundary between governed requests and external or
local capabilities. See `spec/vortex-gateway.md` for the normative
specification and `spec/conformance.md` for the full spec↔code↔test
matrix.

```
REQUEST → AUTHENTICATION → VALIDATION → CONNECTOR RESOLUTION
        → CREDENTIAL BOUNDARY → EXECUTION (timeout-bounded)
        → OBSERVATION → EXECUTION PROOF
```

## Status

- TypeScript, Node ≥20, **zero runtime dependencies**.
- 66/66 conformance tests pass (`npm run test:conformance`).
- 100% line / 100% branch / 100% function coverage on every file under
  `src/`, measured with Node's built-in `--experimental-test-coverage`
  (`npm run test:coverage`) — not estimated, not asserted without the
  run to back it.
- Integrates with Vortex MCP **by contract compatibility**
  (`InvokeRequest` / `ExecutionProof` shapes match what was agreed as
  the Gateway Specification v1 baseline during this project's
  architecture discussion) — this package has not been tested against
  the actual `vortex-mcp` source, because that source was not available
  to generate this package. See "Honest gaps" below.

## Quick start

```bash
npm run build
npm run test:conformance
npm run test:coverage
```

```ts
import {
  Gateway,
  StaticTokenAuthenticator,
  ConnectorRegistry,
  CredentialBroker,
  FilesystemConnector,
} from "./dist/src/index.js";

const gateway = new Gateway({
  authenticator: new StaticTokenAuthenticator({ "agent-token": "gpt-5.6" }),
  connectors: new ConnectorRegistry().register(new FilesystemConnector("/srv/sandbox")),
  credentials: new CredentialBroker().register({
    id: "fs-write",
    secret: { role: "writer" },
    scope: [{ connector_id: "filesystem", operations: ["read", "write"] }],
  }),
});

const result = await gateway.invoke(
  {
    request_id: "req-001",
    connector_id: "filesystem",
    operation: "write",
    input: { path: "proposal/patch.diff", content: "--- a\n+++ b\n" },
    credential_id: "fs-write",
    timeout_ms: 5000,
  },
  "agent-token"
);

console.log(result.proof); // ExecutionProof, hash-committed, always present
```

## Layout

```
spec/                        11 normative documents
src/
  types.ts                   InvokeRequest / ExecutionProof / contracts
  canonicalize.ts             deterministic JSON canonicalization + hashing
  auth.ts                     Authenticator (reference: static token)
  validate.ts                 structural request validation
  connector-registry.ts       connector + operation resolution
  credential-broker.ts        credential scope enforcement
  executor.ts                 timeout-bounded execution
  proof.ts                    ExecutionProof construction + tamper evidence
  gateway.ts                  the pipeline orchestrator
  connectors/filesystem.ts    sandboxed reference connector
  index.ts                    public exports
test/conformance/*.test.ts    one file per spec document (see conformance.md)
```

## Honest gaps (read before treating this as production-ready)

This section exists because the parent project's own standard (GOS3 /
"zero-simulação-oculta") is to distinguish what is implemented from what
is only specified. Applying that standard to this package itself:

1. **No independent verifier process.** Proofs are produced; nothing
   here re-derives a proof from a live artifact independently of the
   process that produced it.
2. **No cryptographic signature on proofs.** `proof_hash` is
   tamper-evident, not identity-bound. See `spec/execution-proof.md`.
3. **`repository_state_hash` / `change_hash` not implemented.** Only the
   middle hash of the three-hash design (execution proof) is here. See
   `spec/execution-proof.md` §"Relationship to the broader three-hash
   design".
4. **One reference connector (`filesystem`), no GitHub/Qwen/GPT/Claude
   adapters.**
5. **One reference authenticator (static token), not production-grade.**
6. **In-memory registries only** — no persistence, no audit log survives
   a process restart.
7. **Not tested against the real `vortex-mcp` source** — only against
   the contract described in this project's own architecture
   discussion, because the actual `vortex-mcp` repository was not part
   of what was uploaded to generate this package.

None of these are hidden in the code or glossed over in the spec docs —
each one is called out at the point in `spec/` where it's relevant, and
`spec/conformance.md` repeats the list explicitly under "What
conformance here does NOT claim".
