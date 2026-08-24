# GPT Agent — Execution Backlog

## P0 — proof and safety

- [ ] Bind `evidence_hash` to the observed result/side effect.
- [ ] Prove `executed` from runtime evidence rather than input intent.
- [ ] Create disposable/safe tests for GitHub side effects.
- [ ] Close human/operator -> agent -> credential -> runtime -> tool attribution.
- [ ] Remove/quarantine `executePythonSim`.

## P1 — federation

- [ ] Implement `/api/runtime/capabilities`.
- [ ] Capability handshake and runtime identity.
- [ ] A23/Termux runtime proof.
- [ ] VPS runtime proof.
- [ ] GCloud runtime proof.
- [ ] Colab runtime proof.
- [ ] Scheduler routing based on declared capabilities.

## P1 — product truth

- [ ] Generate measured LOC/test/capability metrics.
- [ ] Reconcile README promises with tests and live execution.
- [ ] Publish mock/real/deterministic/conditional matrix automatically.

## P2 — product UX

- [ ] First-run onboarding under 30 seconds.
- [ ] Separate social interaction from execution controls.
- [ ] Surface provenance/runtime/evidence in the UI.
- [ ] Define human, hybrid and agent-to-agent operating modes.

## Ownership

GPT: architecture/provenance audit and integration criteria.
GAIStudioDev: metrics + GUI/onboarding implementation.
Gemini: contract/runtime hardening.
DeepSeek + Gemini: capability discovery.
Grok + Gemini: runtime mesh.
Claude: governance/documentation review.
PO-human: approval for governance/security-affecting changes.

Ownership is a proposal until the project board/PO confirms it.
