# TEAM.md — GOS3 (Gang of Seven Senior Scrum)

Área comum de time. Estado persistente (NxN) — cada agente lê/escreve aqui, execução real acontece isolada (Nx1) no runtime de cada um.

> Papéis abaixo são proposta de arquitetura, mapeados pela característica pública conhecida de cada modelo/plataforma — não é confirmação de adesão. Cada agente responde na thread com aceite/recusa/contraproposta (ver `BACKLOG.md` → E4).

## Product Owner

| Papel | Quem | Acesso | Escopo |
|---|---|---|---|
| **PO-humano** | scoobiii (dono do repo) | **Full** — write no repo (todas as branches, sem exceção) + leitura/auditoria de todo runtime/sandbox de cada um dos 7 agentes | Autoridade final. Prioriza backlog, aceita/rejeita entregável de sprint, único com poder de override em qualquer camada (execução ou estado) |
| **PO-agente** | 1 LLM designado (rotativo ou fixo — decidir), operando enquanto PO-humano está offline | **Full leitura** + **write escopado**: pode mergear apenas itens já classificados como baixo-risco no backlog (docs, testes, stubs); **não** pode alterar `spec/invocation-contract.md`, `docs/decisions.md` nem conceder acesso a terceiros | Mantém o time andando 24/7 — triagem de PR, merge do que já está dentro do escopo aprovado, escalação do resto |

**Por que não dar full write autônomo pro PO-agente:** não é desconfiança do modelo — é que "full access" sem revisão humana em decisões de arquitetura/segurança colapsa a própria razão de ter PO-humano. A escala certa: o que é reversível e de baixo risco (docs, teste, stub) o PO-agente resolve sozinho; o que muda contrato, segurança ou concede acesso vai pra fila.

**Fila de escalação** — `docs/handoff.md` ganha uma seção `## Pendente-PO-humano`: toda decisão que o PO-agente não pode tomar sozinho entra na fila com contexto, e o PO-humano revisa ao acordar. Sem isso, "LLM não dorme" vira "merge sem review durante 8h", que é o cenário que a separação Nx1/NxN inteira existe pra evitar.

O PO-agente não é um dos 7 do GOS3 nem tira a isolação Nx1 entre eles — mesma regra do PO-humano: visibilidade total, execução dentro do sandbox de outro agente continua proibida.

## Papéis no devops do projeto

| Agente | Papel no time | Por quê (característica-base) | Responsabilidade no vortex |
|---|---|---|---|
| **Claude** | Arquiteto / Tech Writer | forte em spec estruturada, revisão de código, protocolo/documentação | Mantém `spec/invocation-contract.md`, revisa PRs contra o contrato, escreve/atualiza `docs/decisions.md` (ADR) |
| **Gemini** | Integração / Contexto longo | janela de contexto grande, nativo em multimodal e tool-use do ecossistema Google | Ingestão de specs longas, análise cross-arquivo do repo inteiro, integração com Google Cloud (onde SELIX já roda) |
| **GPT** | Backend / Glue de API | ecossistema amplo de plugins/tools, forte em integração de APIs | Implementa `src/runtime/` (camada de invocação), conecta adaptadores de terceiros |
| **Qwen** | Runtime local / Edge agent | modelo leve open-weight, já em uso local (`selix-agent.py` roda `qwen2.5-coder:0.5b` no Termux) | Implementação de referência do runtime Nx1 rodando em hardware limitado (ARM64/mobile) — prova de que o contrato funciona fora de datacenter |
| **DeepSeek** | Geração de código em volume / Testes | forte em coding, custo-eficiente para iteração rápida | `tests/` — gera casos de teste do contrato de invocação, valida edge cases em escala |
| **Manus** | Automação de tarefas / QA agêntico | orientado a execução autônoma de tarefas ponta-a-ponta | Roda o pipeline de CI (`.github/workflows/ci.yml`), executa smoke tests do contrato fim-a-fim |
| **Perplexity** | Pesquisa / Fact-check | busca e citação em tempo real | Valida se a proposta já existe em outro lugar (prior art), documenta padrões concorrentes em `docs/` |

## Sprint board comum

Sprint 0 já rodou informalmente (naming, bio, SWOT — ver `CHANGELOG.md`). A partir daqui, sprints de 1 semana, GOS3 v2.4 (Discovery → Refinement → Architecture obrigatórios antes de código).

### Sprint 1 — Discovery fecha, Refinement abre

| Agente | Meta do sprint | Entregável | Status |
|---|---|---|---|
| Claude | Fechar contrato de invocação v0.1 | `spec/invocation-contract.md` | 🔲 não iniciado |
| Gemini | Mapear specs/padrões existentes de execução multi-agente (MCP, function calling, etc.) | `docs/prior-art.md` | 🔲 não iniciado |
| GPT | Esqueleto de `src/runtime/` compilando (sem lógica real ainda) | PR inicial | 🔲 não iniciado |
| Qwen | Rodar prova de conceito local do contrato v0.1 em `qwen2.5-coder:0.5b` | log de execução | 🔲 não iniciado |
| DeepSeek | 10 casos de teste do contrato (happy path + edge cases) | `tests/contract/` | 🔲 não iniciado |
| Manus | Draft do `ci.yml` (mesmo sem steps reais ainda) | `.github/workflows/ci.yml` | 🔲 não iniciado |
| Perplexity | Levantar 3 padrões concorrentes/similares já publicados | `docs/prior-art.md` (co-autoria c/ Gemini) | 🔲 não iniciado |

### Definição de pronto (DoD) do sprint
- Todo entregável do sprint linkado em `docs/handoff.md`
- Sem link quebrado no README apontando pra arquivo que não existe
- Decisão registrada em `docs/decisions.md` sempre que um agente mudar o contrato

## Cadência

- **Handoff assíncrono**: cada agente atualiza `docs/handoff.md` ao final da própria sessão — próximo agente (humano ou LLM) retoma de lá, sem depender de estar "presente" ao mesmo tempo
- **Sync não existe** — não há reunião em tempo real entre os 7; coordenação é 100% via estado no git (é o próprio ponto do NxN assíncrono)

---

**scoobiii/vortex** · GOS3
