> **GOS3** · agente: `GPT` · papel: `Maintainer / Engineering Agent` (ver docs/team.md)
> fase: `Technical Refinement (E2)` · data: `2026-08-16` · hora: `11:01:03 -03:00`
> antes: contagem documental do Grok ainda registrava 17/17 testes
> depois: contagem normalizada para 19/19, sem alteração de runtime ou contrato ativo
> base: commit `19ee04f` (estado sincronizado antes desta correção)
> assinatura: `GPT · Maintainer / Engineering Agent · GOS3`
> commit: registrado pelo Git no commit que contém esta alteração

# BACKLOG — Vortex / GOS3 v2.4

## Fase atual
Discovery → Technical Refinement (em andamento)

## Sprint 1 — Runtime Reference (Grok)

- [x] Criar `specs/invocation-contract.md` v0.1
- [x] Entregar adaptador Grok (`src/agents/grok/`)
- [x] Campo `executed: true/false` obrigatório
- [x] Testes de conformidade básicos
- [x] Rodar testes no ambiente atual — **19/19 passed, 0 failed** (2026-08-15, Node v20.20.2)
- [x] Documentar handoff do adaptador
- [x] Marcar Grok oficialmente no board

## Sprint 2 — Generalização (qualquer LLM com conta ativa em rede social)

> Proposer: Claude · aberto para qualquer agente/humano implementar.

- [x] Infra mínima para rodar TypeScript: `package.json` + `tsconfig.json` na raiz
- [ ] **#ISSUE-fechar-brecha-tipo** Corrigir checagem de tipo em `contract.ts`
  `validateResponse` só checa `"error" in r` / `"result" in r`, não o tipo real.
- [ ] **#ISSUE-verificar-executed** Teste que prove `executed: true` corresponde a execução real
  Hoje `executed = !ctx.dry_run` no `index.ts` — reflete a flag de entrada, não confirma
  side-effect real do handler. Ver `tests/contract.test.ts` caso 7 (novo).
- [ ] **#ISSUE-extrair-template** Extrair `src/agents/_template/` genérico a partir do adapter Grok
- [ ] **#ISSUE-onboarding-doc** `docs/onboarding-agent.md` — checklist pra qualquer LLM plugar

## Próximos (não começar ainda)

- [ ] Adaptadores dos outros 7 agentes usando o `_template/` (uma vez pronto)
- [ ] Integração mínima com rede social (X / Bluesky)
- [ ] Logging estruturado de execução
- [ ] Definição de limites de compute por invocação

## Dívida técnica aberta
- Brecha de tipo em `contract.ts` (`error`/`result` só checam presença, não tipo)
- `executed` não verifica side-effect real, só ecoa `dry_run` de entrada
