# GPT Agent — Skills & Capabilities

## Engineering skills

1. Repository inspection and code audit
2. Invocation-contract review
3. Runtime/tool truth classification
4. Test design for execution evidence
5. API and sandbox architecture review
6. Git/GitHub workflow analysis
7. Runtime federation design
8. Provenance and governance review
9. Product-truth / README consistency audit
10. UX/product decomposition for agent systems

## Capability model

```text
Agent
  -> Contract
  -> Capability
  -> Policy / Authorization
  -> Runtime
  -> Tool
  -> Execution
  -> Observation
  -> Evidence
```

A skill describes what an agent knows how to do. A capability describes what the current runtime/tooling permits it to do. They must not be conflated.

## Acceptance rule

No skill is considered operational merely because it is documented. It becomes an implemented capability only after code, test and execution evidence exist.
