# Authorization — spec v1

## Principle

> "tenho acesso" ≠ "estou autorizada a executar"

Every mutating operation MUST carry an `AuthorizationContext`:

```json
{
  "principal_id": "scoobiii",
  "agent_id": "agent/llm",
  "policy_id": "vortex-development",
  "policy_version": "1",
  "capability": "repository.write",
  "scope": { "repository": "scoobiii/vortex", "branch": "feat/*" },
  "gos3_session_id": "gos3-...",
  "sandbox_id": "sandbox-..."
}
```

## Capability declarations

A connector MUST declare its capabilities with an explicit scope — a
bare `{"capability": "github"}` is not sufficient:

```json
{
  "capability": "repository.write",
  "scope": { "repositories": ["scoobiii/vortex"], "branches": ["feat/*"] },
  "side_effect": true,
  "approval": "required"
}
```

## Policy decision

For every `(capability, scope)` pair, a policy evaluates to exactly
one of:

| decision     | meaning                                                          |
|--------------|-------------------------------------------------------------------|
| `automatic`  | authorized to execute immediately                                 |
| `required`   | authorized only after a GOS3-onboarded human approval (see `gos3.md`) |
| `prohibited` | never authorized under this policy, regardless of session state   |

`inspect` and `propose` MAY proceed under a `required` rule without
prior onboarding (they have no side effects); `execute` and
`branch.write` MUST NOT.

## Non-escalation

A request whose scope falls outside the policy's `allowed_scopes`
(e.g. `repository: "forbidden/repo"` against an
`allowed_scopes.repository: "scoobiii/*"` rule) MUST be rejected with
`POLICY_DENIED` — independent of whether the request otherwise carries
a valid GOS3 session or a fresh `request_id`. Authorization scope
checks and anti-replay checks are independent gates; passing one never
substitutes for the other.
