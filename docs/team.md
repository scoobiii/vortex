> GOS3 - agente: Claude - papel: Proposer (ver docs/team.md)
> fase: Technical Refinement - data: 2026-08-30
> antes: team.md listava Grok como unico Nx1 confirmado, sem mencionar
>   moltH como runtime soberano real por tras da execucao
> depois: reclassifica os 7 agentes como Proposers NxN (nenhum tem sandbox
>   soberano proprio confirmado), moltH entra como Runtime Reference real
> base: auditoria moltH 2026-08-30
> assinatura: Claude - Proposer - GOS3
> status: PROPOSED

# Team — GOS3 (Gang of Seven + Runtime Soberano)

## Agentes no board (NxN — Proposers)

Nenhum destes tem, confirmado, sandbox/runtime soberano próprio.
Todos propõem no backlog compartilhado; execução real acontece via
runtime soberano (ver seção abaixo).

| Agente       | Papel atual          | Status      | Runtime próprio confirmado? |
|--------------|-----------------------|-------------|------------------------------|
| Gemini       | Proposer              | Convidado   | Não |
| Claude       | Proposer               | Ativo (Sprint 2 — Generalização) | Não — sem rede de saída, sem persistência entre sessões |
| GPT          | Proposer               | Convidado   | Não |
| Qwen         | Proposer               | Convidado   | Não |
| DeepSeek     | Proposer               | Convidado   | Não — tem framework DSH, mas sem acesso a filesystem/runtime Node nesta config |
| Manus        | Proposer               | Convidado   | Não confirmado |
| Perplexity   | Proposer               | Convidado   | Não |
| Grok         | Proposer               | Convidado   | **Não** — corrigido em 2026-08-30. Roda no sandbox do X, mas sem Node.js, sem repo clonado, sem execução de comando arbitrário. Ver correção abaixo. |

## Runtime Soberano (Nx1 — Execução Real)

| Runtime | Papel | Status | Evidência |
|---------|-------|--------|-----------|
| **moltH** | Runtime Soberano Imperativo (A23/Termux/proot-distro) | **Confirmado** | Sprint 0 provado: envelope offline `{"valid": true}`. Python Contract Gate 4/4. TS Contract Gate 6/6 (inclui `runtime_id` obrigatório, ADR-003). |

moltH é o único runtime confirmado com execução soberana imperativa —
Node.js real, filesystem real, comandos arbitrários dentro de allowlist,
`runtime_id` + `evidence_hash` verificáveis por invocação.

## Correção histórica (2026-08-30)

Versão anterior deste arquivo dizia:

> "Grok é o primeiro adaptador real do invocation-contract.md v0.1...
> Confirmado — 19/19 testes passed"

Isso estava certo tecnicamente (o adaptador rodou e passou), mas induzia a
leitura errada de que **o Grok** tinha runtime próprio. Na verdade, os
19/19 testes rodaram **no runtime do operador** (Termux/Alpine), usando o
Grok só como referência de shape de contrato — não como sandbox soberano do
Grok em si. Auditoria do moltH (2026-08-30) confirmou isso explicitamente
para Grok, Meta e DeepSeek: nenhum tem runtime soberano imperativo próprio
nesta configuração.

O adaptador Grok continua válido como **referência de contrato** (o shape
`InvocationRequest`/`InvocationResponse` está correto e testado) — só a
alegação de "sandbox soberano do Grok" é que foi corrigida.

## Regras de Ouro (adicionado)

5. **Proposer ≠ Runtime**: um agente pode propor (raciocinar, gerar código,
   sugerir patch) sem ter runtime soberano próprio. Só é promovido de
   Proposer pra Runtime Reference com prova de execução real
   (`runtime_id` + `evidence_hash`), auditável por terceiros — não por
   alegação própria.
6. **Zero Fake Sandbox**: nenhum agente pode se descrever como tendo
   "sandbox soberano" ou "runtime próprio" sem prova equivalente ao que
   moltH já demonstrou (Contract Gate passando, envelope verificável).

---

**scoobiii/vortex** · GOS3 · runtime soberano: moltH (ver link no README)
