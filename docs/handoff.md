> **GOS3** · agente: `GPT` · papel: `Maintainer / Engineering Agent` (ver docs/team.md)
> fase: `Technical Refinement (E2)` · data: `2026-08-16` · hora: `11:18:18 -03:00`
> antes: Sprint 1 estava marcado como 5/7 e o item de confirmação do Grok permanecia pendente no handoff
> depois: Sprint 1 passa a 7/7 e o handoff fica alinhado ao board, onde Grok já está confirmado
> base: commit `0ff03dc`
> assinatura: `GPT · Maintainer / Engineering Agent · GOS3`
> commit: registrado pelo Git no commit que contém esta alteração

# docs/handoff.md — Vortex / GOS3 v2.4

> Fase: Discovery → Technical Refinement
> Última atualização: 2026-08-15

Estado para retomada entre sessões/agentes. Se você é o próximo a mexer neste
repo (humano ou LLM), comece por aqui antes de reler tudo do zero.

## Onde o projeto está agora

**Sprint 1 (Runtime Reference — Grok): 7/7 itens fechados.**

- [x] `specs/invocation-contract.md` v0.1
- [x] Adaptador Grok (`src/agents/grok/`)
- [x] Campo `executed: true/false` obrigatório
- [x] Testes de conformidade (7 casos, `contract.test.ts`)
- [x] **Rodar testes no ambiente atual — 19/19 passed, 0 failed**
      (2026-08-15, Node v20.20.2, `npm run test:grok`)
- [x] Documentar handoff do adaptador *(este arquivo cobre isso agora)*
- [x] Marcar Grok oficialmente no board (`docs/team.md` — status confirmado,
      com data/evidência)

## O que precisou ser corrigido pra sair do papel

O código do adaptador (`contract.ts`, `handler.ts`, `index.ts`, `types.ts`,
`contract.test.ts`) já existia e parecia pronto, mas **nunca tinha sido
executado**: faltava `package.json` e `tsconfig.json` na raiz. Sem isso,
`npx ts-node ...` falhava com `TypeError: Cannot read properties of
undefined (reading 'fileExists')` — sintoma de `typescript` ausente e
nenhum tsconfig pra configurar o compilador.

Adicionados (raiz do repo):
- `package.json` — declara `typescript`, `ts-node`, `@types/node` como
  devDependencies + scripts (`test:grok`, `grok:ping`, `grok:echo`, `grok:dry`)
- `tsconfig.json` — `target: ES2020`, `module: CommonJS` (necessário porque
  `index.ts` usa `require.main === module`, padrão CommonJS)

Isso importa como lição geral: **"código existe" ≠ "código roda"**. Todo
próximo adaptador (outros 6 agentes) deve ter esse mesmo passo de infra
verificado antes de marcar qualquer item de teste como concluído.

## Dívida técnica conhecida (não bloqueante, mas documentada)

1. **`contract.ts` — checagem de tipo incompleta.**
   `validateResponse` verifica `"error" in r` e `"result" in r` (presença),
   não o tipo. Um `response.error = 42` passaria na validação hoje.

2. **`executed: true` não prova execução real — só ecoa a entrada.**
   Em `index.ts`: `executed: !ctx.dry_run`. Isso reflete a flag que o
   *chamador* mandou no request, não confirma que o handler causou algum
   efeito observável. O 7º caso de teste (`contract.test.ts`) documenta essa
   lacuna deliberadamente — ele passa hoje justamente para provar que o
   contrato aceita esse cenário sem reclamar. Não é falha de teste, é alarme
   permanente até alguém fechar a lacuna.

   Critério que resolveria: response carregar evidência verificável de
   execução (hash do resultado + timestamp assinado, ou side-effect
   registrado em `logs` de forma estruturalmente distinguível de dry_run).

3. **`docs/tree.md` desatualizado.** Lista só `README.md` + `docs/`, não
   reflete `specs/` nem `src/` que já existem.

## O que NÃO fazer sem escalar pro PO-humano

Regra de `docs/PLAYBOOK.md` (se ainda não existir no repo, ver seção de
governança abaixo): mudança em `specs/invocation-contract.md` ou em
qualquer coisa que afete segurança/acesso nunca é merge automático, mesmo
que pareça pequena.

## Próximos passos sugeridos, em ordem

1. Fechar os 2 itens restantes do Sprint 1 (handoff = feito agora; marcar
   Grok no board = trivial, só atualizar `team.md`).
2. Resolver a dívida técnica #2 acima antes de replicar o adaptador pros
   outros 6 agentes — do contrário, os 7 herdam a mesma lacuna de auditoria.
3. Extrair `src/agents/_template/` do adaptador Grok, separando o que é
   específico-xAI do que é genérico (ver Sprint 2 no `BACKLOG.md`).
4. Corrigir `docs/tree.md`.

## Como verificar o estado por si mesmo (não confiar só neste texto)

```bash
cd ~/vortex
npm install
npm run test:grok
# esperado: 19 passed, 0 failed
git log --oneline -10
git status
```

---
*Registrado por Claude (GOS3 · NxN · Proposer) a partir de execução real
confirmada pelo operador do repo. Ver `docs/proposals/claude/README.md`
para histórico completo de propostas.*
