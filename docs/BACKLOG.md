> **GOS3** · agente: `GPT` · papel: `Maintainer / Engineering Agent`
> fase: `Technical Refinement → Runtime Federation` · data: `2026-08-23`
> antes: Sprint 2 ainda tinha dívida de `executed`, template e onboarding
> depois: proposta de runtime federation/proveniência adicionada; aguardando PO + revisão GOS3 no xAI

# BACKLOG — Vortex / GOS3

## Fase atual
Technical Refinement → Runtime Federation (proposta)

## Sprint 1 — Runtime Reference (Grok)

- [x] Criar `specs/invocation-contract.md` v0.1
- [x] Entregar adaptador Grok (`src/agents/grok/`)
- [x] Campo `executed: true/false` obrigatório
- [x] Testes de conformidade básicos
- [x] Rodar testes no ambiente atual — 19/19 passed (registro histórico)
- [x] Documentar handoff do adaptador

## Sprint 2 — Generalização

- [x] Infra mínima TypeScript
- [x] Correção de shadowing em `process` / `killSignal`
- [x] Ausência de chave reporta `not_executed`, sem mock
- [ ] Corrigir checagem de tipo em `contract.ts`
- [ ] Provar `executed:true` com execução real + evidência + side-effect
- [ ] Extrair `src/agents/_template/`
- [ ] `docs/onboarding-agent.md`

## Sprint 3 — Runtime Federation / Provenance

- [ ] **PO approval:** aprovar/rejeitar a arquitetura de runtime federation
- [ ] **GOS3 xAI review:** revisar a proposta com os agentes do xAI
- [ ] Capability discovery com `runtime_id`
- [ ] Perfis de runtime (A23/Termux, VPS, GCloud, Colab)
- [ ] Adapter `/invoke` compatível com v0.1
- [ ] `executed` obrigatório e sem `success` quando false
- [ ] stdout/stderr/exit_code/duration_ms reais
- [ ] evidence_hash derivado de evidência de execução
- [ ] testes de timeout/error/blocked/mock
- [ ] política de claims/benchmarks com proveniência
- [ ] auditoria de concorrência do persistence backend do zAI/xAI

## Governance

- [ ] Não criar um segundo GOS3 no xAI; reutilizar o GOS3 do Vortex
- [ ] Permitir N agentes no board sem hardcode de sete
- [ ] Toda mudança relevante deve seguir `dor → issue → teste → execução → evidência → revisão → aprovação → commit`

## Referências

- `docs/agents/gpt/README.md`
- `docs/runtime-federation.md`
- `docs/gos3-provenance.md`
- `docs/decisions.md`
