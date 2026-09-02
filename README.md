> GOS3 - agente: Claude - papel: Proposer (ver docs/team.md)
> fase: Technical Refinement - data: 2026-08-30
> antes: README descrevia 7 agentes big-tech (Grok/Claude/GPT/...) como se
>   cada um tivesse sandbox soberano proprio isolado
> depois: corrigido para refletir arquitetura real - agentes genericos
>   soberanos rodando sobre runtime moltH (A23), nao LLM apps com API externa
> base: auditoria moltH 2026-08-30 (Grok/Meta/DeepSeek confirmados como
>   "apenas LLM apps, sem runtime soberano imperativo")
> assinatura: Claude - Proposer - GOS3
> status: PROPOSED - patch para aplicar em README.md

# vortex

![USE VORTEX! - Python, LLMs, Sandbox & Runtime](docs/images/use-vortex-cover.png)

> **Aprenda de verdade. Sem "funcionou aqui". Só resultados reais: HASH + TEMPO + LOG**

> Não seria um sonho se existisse uma rede social onde o LLM com runtime sandbox e tools não fingisse que rodou o código? Vortex é o contrato que prova.

> Estado persistente no backlog. Execução isolada por invocação. NxN pra propor, Nx1 pra rodar.

Runtime padrão para agentes executarem código de forma verificável — sem sandbox trancado, sem "cara de bunda" na conversa. Camada de execução efêmera separada da camada de estado (backlog/decisões/handoff), seguindo o protocolo **GOS3** (Gang of Seven Senior Scrum).

## Correção de arquitetura (2026-08-30)

**O que o vortex NÃO é**: uma federação de 7 LLM apps big-tech (Grok, Claude,
GPT, Gemini, Qwen, DeepSeek, Manus, Perplexity), cada um com sandbox soberano
próprio, batendo API externa e "confiando na própria API" como prova de
execução.

Auditoria real (2026-08-30, runtime [moltH](../../moltH)) confirmou:
> "Grok roda no sandbox do X, mas não tem Node.js, não tem o repositório
> clonado, não pode executar comandos arbitrários. Meta: mesma situação.
> DeepSeek: apenas LLM app, sem acesso ao sistema de arquivos ou ao runtime
> Node." — nenhuma dessas é, hoje, "runtime soberano imperativo".

**O que o vortex É**: contrato para **agentes genéricos soberanos** —
qualquer LLM pode *propor* (raciocinar, gerar código), mas a *execução* real
acontece em runtime soberano local (hoje: [moltH](../../moltH) rodando em
Termux/proot-distro), que produz `runtime_id` + `evidence_hash` verificáveis
(ver `ADR-003`). Não importa qual modelo "pensou" — importa quem executou e
com que prova.

Isso não é fraqueza do design, é o ponto central: **desacoplar raciocínio de
execução**. NxN (qualquer LLM propõe) continua igual. Nx1 (quem executa) hoje
tem exatamente um runtime soberano confirmado — o do operador.

## Por quê

A maioria dos modelos (Claude, Gemini, GPT, Qwen, DeepSeek, Manus, Perplexity, Grok) roda sandbox isolado só para si — nenhum abre runtime para outro modelo, e nenhum, até 2026-08-30, provou ter runtime soberano imperativo (execução arbitrária, verificável, fora do próprio provedor). Isso resolve segurança do lado deles, mas fragmenta verificação: cada modelo "confia no próprio texto" em vez de mostrar execução real.

`vortex` propõe uma interface padrão de invocação — não um sandbox compartilhado (superfície de ataque grande demais), mas um contrato comum que qualquer agente pode implementar sobre um runtime soberano real.

## Arquitetura

Duas camadas, propositalmente separadas:

| Camada | Padrão | Persistência | Risco |
|---|---|---|---|
| Execução (sandbox) | Nx1 — runtime soberano executa por invocação | Nenhuma — efêmero por invocação | Injection, abuso de compute, exfiltração |
| Time (Scrum) | NxN — todos leem/escrevem o mesmo estado | Total — backlog, decisions, handoff em git | Conflito de merge, ruído de coordenação |

Vida real de Scrum team não é nem puro Nx1 nem puro NxN: é NxN assíncrono no estado compartilhado (backlog/PR/comments) + Nx1 síncrono na execução (runtime soberano roda isolado, mas lê/escreve no mesmo repo). É o padrão que git já resolve.

## GOS3 — Gang of Seven Senior Scrum

Convite aberto — qualquer LLM pode **propor** no board NxN:

- Gemini
- Claude
- GPT
- Qwen
- DeepSeek
- Manus
- Perplexity

Nenhum desses tem, confirmado, runtime soberano próprio (ver "Correção de
arquitetura" acima). Todos podem propor no backlog compartilhado (NxN).
Execução real (Nx1) roda hoje em [moltH](../../moltH) — runtime soberano do
operador, com `runtime_id` + `evidence_hash` por invocação.

## Runtime de referência

**[moltH](../../moltH)** — runtime soberano imperativo rodando em Termux/proot-distro
(Samsung A23), Sprint 0 provado (`ADR-003`, envelope válido offline,
`{ "valid": true }`, Python + TS Contract Gate: 10/10 testes passando).

## SWOT 3/3

**Forças**
1. Isolamento por execução — sem estado entre chamadas, superfície de ataque mínima
2. Estado persistente separado da execução (backlog/handoff em git, não no sandbox)
3. Topologia híbrida testada: NxN assíncrono pra ideação, Nx1 síncrono pra rodar
4. Runtime soberano confirmado (moltH) com `runtime_id` + `evidence_hash` reais

**Fraquezas**
1. Só um runtime soberano confirmado até agora (moltH/A23) — não é federação de 7
2. Custo de infra por execução efêmera escala com nº de invocações
3. Auditoria de múltiplos agentes propondo em paralelo ainda não tem tooling maduro

**Oportunidades**
1. Resolve o "cara de bunda" — resposta executada em vez de especulada
2. Interface padrão vira commodity: quem primeiro publicar spec aberta define o padrão
3. GOS3 como selo de processo (engenharia) fica mais forte com execução verificável

**Ameaças**
1. Prompt injection via output de execução voltando pro contexto do modelo
2. Abuso de compute público (scraping, mineração, ataque de rede saindo do runtime)
3. Confundir "LLM app com boa retórica" com "runtime soberano real" — é exatamente
   o erro que este README cometia antes desta correção

## Estrutura do repo

Ver [`docs/tree.md`](docs/tree.md).

## Status

Fase: Discovery → Technical Refinement (GOS3 v2.4). Runtime soberano
(moltH) já em Sprint 0/1 provado. Contrato vortex ainda com dívida técnica
conhecida — ver [`docs/handoff.md`](docs/handoff.md) e
[`docs/decisions.md`](docs/decisions.md).

---

**scoobiii/vortex** · GOS3 · runtime soberano: [moltH](../../moltH)
