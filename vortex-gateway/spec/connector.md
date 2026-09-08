> **GOS3** · Vortex Foundation conformance artifact

# Connector

## Contract

```ts
interface ConnectorContext {
  request_id: string;
  operation: string;
  credential?: unknown;   // opaque, injected by the Credential Boundary
  signal: AbortSignal;    // MUST be honored for cancellation on timeout
}

interface VortexConnector {
  readonly id: string;
  readonly operations: readonly string[];
  invoke(input: unknown, ctx: ConnectorContext): Promise<unknown>;
}
```

## Resolution

Given `connector_id` and `operation`, the Gateway MUST:

1. Reject with `UNKNOWN_CONNECTOR` if no connector is registered under
   `connector_id`.
2. Reject with `UNKNOWN_OPERATION` if the connector is registered but
   does not declare `operation` in its `operations` list.

Connector resolution happens **before** credential resolution, so an
attempt against a nonexistent connector never leaks whether a given
credential would otherwise have been valid.

## Provider adapters are thin

A connector implementation SHOULD NOT embed Vortex-specific governance
logic (policy, GOS3, benchmark scoring). It implements exactly:
"given this input and this context, do the operation, return the
output, or throw." Everything upstream of that (authorization, scope,
evidence) is the Gateway's and MCP's job, not the connector's.

## Reference implementation

`src/connector-registry.ts` (`ConnectorRegistry`), `src/connectors/
filesystem.ts` (`FilesystemConnector` — a sandboxed reference connector
proving the contract end-to-end: path-traversal and absolute-path
escapes are rejected against the *resolved* path, not the input string).

## Conformance tests

`test/conformance/resolve.test.ts`,
`test/conformance/filesystem-connector.test.ts`.
