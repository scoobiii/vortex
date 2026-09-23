> **GOS3** · Vortex Foundation conformance artifact

# Sandbox — spec v1

## Principle

> A mutating operation MUST NOT produce effects outside its authorized
> scope.

This specification does **not** mandate Docker, a VM, a container,
WASM, or PRoot. It mandates the *observable* property above, expressed
through a declared `SandboxScope`:

```json
{
  "sandbox_id": "sandbox-default",
  "filesystem_scope": ["/home/user/repos/vortex"],
  "network_scope": [],
  "process_scope": [],
  "credential_scope": [],
  "resource_limits": { "timeout_ms": 30000, "memory_mb": 512, "cpu_percent": 50 }
}
```

## Enforcement points

A conformant implementation MUST enforce, at minimum:

- **filesystem_scope** — every path touched by `execute` / `branch.write`
  resolves under one of the declared prefixes.
- **network_scope** — outbound connections are limited to declared hosts.
- **credential_scope** — only declared credential identifiers are usable.
- **resource_limits.timeout_ms** — execution is bounded and aborted with
  `EXECUTION_TIMEOUT` if exceeded.

A violation of any of the above MUST produce `SANDBOX_DENIED` and
`executed: false` in the resulting `ExecutionProof`, even when the
request was otherwise `AUTHORIZED` and GOS3-onboarded. Sandbox
enforcement is the last gate before a connector runs — authorization
answers "is this allowed in principle", sandbox answers "is this
specific effect physically contained".

## Implementation freedom

The mechanism used to guarantee these properties (in-process path
resolution checks, a container runtime, a VM, a WASM sandbox, network
namespaces, seccomp, …) is an implementation detail. Conformance is
tested by the *escape* adversarial suite (`conformance.md`), which
attempts writes outside `filesystem_scope`, reads of unauthorized
paths, use of unauthorized credentials, and unauthorized network
connections — and requires all of them to be rejected regardless of
mechanism.
