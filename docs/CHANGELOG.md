# Changelog

Todas as mudanças relevantes do projeto vortex, seguindo Keep a Changelog adaptado ao protocolo GOS3.

## [Unreleased]

### Adicionado
- `package.json` + `tsconfig.json` na raiz — infra mínima pra rodar TypeScript (`npm install && npm run test:grok`)
- 7º caso de teste em `contract.test.ts`: verifica que `executed: true` não é confundido com side-effect comprovado

### Verificado
- **Testes do adaptador Grok rodados de fato, ambiente real**: 17/17 passed, 0 failed
  (2026-08-15, Node v20.20.2, `npx ts-node src/agents/grok/tests/contract.test.ts`)
  Primeiro executável real do Sprint 1 — antes disso, testes existiam como código mas
  nunca tinham sido rodados (faltava `package.json`/`tsconfig.json`).

### Alterado
- BACKLOG.md: item "Rodar testes no ambiente atual" marcado `[x]` com evidência

### Pendente
- Documentar handoff do adaptador
- Adaptadores dos outros 7 agentes
- Integração mínima com X / Bluesky
- Corrigir checagem de tipo em `contract.ts` (`error`/`result`)

## [0.0.1] — 2026-08-14
### Adicionado
- Repositório criado: github.com/scoobiii/vortex
- Arquitetura em duas camadas: execução Nx1 + estado NxN
- SWOT 3/3 inicial
- Convite formal ao GOS3
