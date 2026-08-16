> **GOS3** · agente: `MetaAI Jr` · papel: `Branding / Capa`
> fase: `Sprint 1 - Branding - Correção Retroativa` · data: `2026-08-16` · hora: `17:54:03 -03:00`
> antes: e8eddff subiu docs/images/use-vortex-cover.png 4.3M sem GOS3 e sem Signed-off-by
> depois: README com GOS3 compliance + assinatura + rastreio da capa USE VORTEX!
> base: commit `e8eddff`
> assinatura: `MetaAI Jr · Branding · GOS3 - corrigido por scoobiii · PO · GOS3`
> imagem: `docs/images/use-vortex-cover.png` · 4.3M · hash: use-vortex-cover

# vortex

![USE VORTEX! - Python, LLMs, Sandbox & Runtime](docs/images/use-vortex-cover.png)

> **Aprenda de verdade. Sem "funcionou aqui". Só resultados reais: HASH + TEMPO + LOG**

> Não seria um sonho se existisse uma rede social onde o LLM com runtime sandbox e tools não fingisse que rodou o código? Vortex é o contrato que prova.

> Estado persistente no backlog. Execução isolada por invocação. NxN pra propor, Nx1 pra rodar.

Runtime padrão para LLMs executarem código de forma verificável — sem sandbox trancado, sem "cara de bunda" na conversa. Camada de execução efêmera separada da camada de estado (backlog/decisões/handoff), seguindo o protocolo **GOS3** (Gang of Seven Senior Scrum).

## Por quê

A maioria dos modelos (Claude, Gemini, GPT, Qwen, DeepSeek, Manus, Perplexity, Grok) roda sandbox isolado só para si — nenhum abre runtime para outro modelo. Isso resolve segurança, mas fragmenta verificação: cada modelo "confia no próprio texto" em vez de mostrar execução real.

`vortex` propõe uma interface padrão de invocação — não um sandbox compartilhado (superfície de ataque grande demais), mas um contrato comum que qualquer LLM pode implementar sobre seu próprio runtime isolado.

## Arquitetura

Duas camadas, propositalmente separadas:

| Camada | Padrão | Persistência | Risco |
|---|---|---|---|
| Execução (sandbox) | Nx1 — cada agente roda no seu próprio runtime | Nenhuma — efêmero por invocação | Injection, abuso de compute, exfiltração |
| Time (Scrum) | NxN — todos leem/escrevem o mesmo estado | Total — backlog, decisions, handoff em git | Conflito de merge, ruído de coordenação |

Vida real de Scrum team não é nem puro Nx1 nem puro NxN: é NxN assíncrono no estado compartilhado (backlog/PR/comments) + Nx1 síncrono na execução (cada agente roda isolado, mas lê/escreve no mesmo repo). É o padrão que git já resolve.

## GOS3 — Gang of Seven Senior Scrum

Convite aberto aos sete agentes:

- Gemini
- Claude
- GPT
- Qwen
- DeepSeek
- Manus
- Perplexity

Cada um roda seu próprio sandbox isolado (Nx1). Todos leem/propõem no mesmo backlog (NxN). Ninguém guarda estado de execução de ninguém.

## SWOT 3/3

**Forças**
1. Isolamento por execução — sem estado entre chamadas, superfície de ataque mínima
2. Estado persistente separado da execução (backlog/handoff em git, não no sandbox)
3. Topologia híbrida testada: NxN assíncrono pra ideação, Nx1 síncrono pra rodar

**Fraquezas**
1. Nenhum provedor abre runtime pra modelo de fora — depende de todos aderirem
2. Custo de infra por execução efêmera escala com nº de agentes ativos
3. Auditoria de 7 agentes em paralelo ainda não tem tooling maduro

**Oportunidades**
1. Resolve o "cara de bunda" — resposta executada em vez de especulada, em qualquer LLM
2. Interface padrão vira commodity: quem primeiro publicar spec aberta define o padrão
3. GOS3 como selo de processo (engenharia) fica mais forte com execução verificável

**Ameaças**
1. Prompt injection via output de execução voltando pro contexto do modelo
2. Abuso de compute público (scraping, mineração, ataque de rede saindo do runtime)
3. Provedor concorrente lança padrão fechado antes e vira lock-in

## Estrutura do repo

Ver [`docs/tree.md`](docs/tree.md).

## Status

Fase: Discovery (GOS3 v2.4 — três fases obrigatórias antes de código: Discovery → Technical Refinement → Architecture/Mermaid-UML). Ver [`BACKLOG.md`](BACKLOG.md) e [`docs/decisions.md`](docs/decisions.md).

---

**scoobiii/vortex** · GOS3
