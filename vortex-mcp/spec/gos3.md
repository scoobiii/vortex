# GOS3 — spec v1

## Principle

> Um agente não modifica um recurso simplesmente porque consegue
> acessá-lo.

GOS3 is the onboarding/authorization layer for a **resource + session**
pair. It represents the point at which a human (or a higher-authority
process) has explicitly brought a resource into scope for an agent's
session — typically standing in for the "human approval" step implied
by a policy rule with `approval: "required"` (see `authorization.md`).

```
resource → GOS3 ONBOARD → authorized session → modification
```

## Session object

```json
{
  "gos3_session_id": "gos3-...",
  "principal_id": "scoobiii",
  "agent_id": "agent/llm",
  "resources": ["repo:scoobiii/vortex"],
  "issued_at": "...",
  "expires_at": "..."
}
```

## What GOS3 is NOT

GOS3 header/session data is a **contract of entry**, not a
cryptographic proof. It must not be confused with:

| artifact           | provides            |
|--------------------|----------------------|
| GOS3 session        | authorization/context |
| Execution Proof      | accountability        |
| Signature             | cryptographic identity |
| Sandbox                | bounded execution      |

A GOS3 session being present and unexpired is a *necessary* condition
for a `required`-approval mutating operation to proceed — it is never
sufficient on its own; policy scope checks and sandbox checks still
apply independently.

## Expiry and resource coverage

An implementation MUST reject with `ONBOARD_REQUIRED` when:
- no `gos3_session_id` is supplied for an operation whose policy rule
  is `required`,
- the referenced session does not exist,
- the session has expired (`expires_at < now`), or
- the resource targeted by the operation is not covered by any entry
  in `session.resources` (exact match or `prefix/*` match).
