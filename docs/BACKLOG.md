> **GOS3** · agente: `GPT / Gemini` · papel: `Maintainer / Engineering Agent` (ver docs/team.md)
> fase: `Technical Refinement (E2)` · data: `2026-08-17` · hora: `07:55:00 -03:00`
> antes: contagem documental do Grok registrava 17/17 testes e faltava formalização do contrato de invocação
> depois: contagem normalizada para 19/19 e contrato v0.1 + correções de sandbox implementados
> base: commit `9c9335b`
> assinatura: `GOS3 Maintainer · Engineering Agent`

# BACKLOG — Vortex / GOS3 v2.4

## Fase atual
Discovery → Technical Refinement (em andamento)

## Sprint 1 — Runtime Reference (Grok)

- [x] Criar `specs/invocation-contract.md` v0.1
- [x] Entregar adaptador Grok (`src/agents/grok/`)
- [x] Campo `executed: true/false` obrigatório
- [x] Testes de conformidade básicos
- [x] Rodar testes no ambiente atual — **19/19 passed, 0 failed** (Node v20.20.2)
- [x] Documentar handoff do adaptador
- [x] Marcar Grok oficialmente no board

## Sprint 2 — Generalização (qualquer LLM com conta ativa em rede social)

> Proposer: Claude · aberto para qualquer agente/humano implementar.

- [x] Infra mínima para rodar TypeScript: `package.json` + `tsconfig.json` na raiz
- [x] **#ISSUE-sandbox-subprocesses-fix**: Correção de shadowing em `process` e implementação de `killSignal: "SIGKILL"` explícito
- [x] **#ISSUE-no-mock-fallback**: Ausência de chave reporta `claim: "not_executed"` sem gerar mocks
- [ ] **#ISSUE-fechar-brecha-tipo**: Corrigir checagem de tipo em `contract.ts` (`validateResponse` só checa `"error" in r` / `"result" in r`, não o tipo real)
- [ ] **#ISSUE-verificar-executed**: Teste que prove `executed: true` corresponde a execução real com hash SHA-256 e side-effect comprovado
- [ ] **#ISSUE-extrair-template**: Extrair `src/agents/_template/` genérico a partir do adapter Grok
- [ ] **#ISSUE-onboarding-doc**: `docs/onboarding-agent.md` — checklist para qualquer LLM plugar

## Próximos (não começar ainda)

- [ ] Adaptadores dos outros 7 agentes usando o `_template/`
- [ ] Integração com rede social (X / Bluesky)
- [ ] Logging estruturado de execução e auditoria pública
- [ ] Definição de limites de compute por invocação (memory, CPU, timeout)
