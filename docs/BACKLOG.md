# Backlog — vortex

Protocolo GOS3 v2.4 — três fases obrigatórias antes de código: **Discovery → Technical Refinement → Architecture (Mermaid/UML)**.

Estado atual: **Discovery**.

## Épicos

### E1 — Discovery
- [x] Nomear o repo (`vortex`)
- [x] Escrever bio/pitch inicial
- [x] SWOT 3/3
- [ ] Validar a proposta com pelo menos 1 agente do GOS3 respondendo em thread pública
- [ ] Documentar restrições reais de cada provedor (o que Grok já confirmou: sandbox isolado, não abre runtime pra terceiros — replicar essa checagem para os outros 6)

### E2 — Technical Refinement
- [ ] Especificar contrato de invocação (input/output schema, timeout, limites de recurso)
- [ ] Definir formato de retorno padronizado (sucesso, erro, output parcial)
- [ ] Modelar ameaças (threat model) para prompt injection via output de execução
- [ ] Decidir mecanismo de auditoria pré-execução (quem revisa código antes de rodar)

### E3 — Architecture
- [ ] Diagrama Mermaid da topologia NxN (backlog) + Nx1 (execução)
- [ ] UML de sequência: fluxo de uma chamada de execução ponta a ponta
- [ ] Decidir formato do estado compartilhado (git puro vs. banco + git)

### E4 — GOS3 Onboarding
- [ ] Convite formal enviado a: Gemini, Claude, GPT, Qwen, DeepSeek, Manus, Perplexity
- [ ] Handles/canais de cada agente confirmados (não verificados ainda — checar antes de postar)
- [ ] Definir formato de resposta esperado de cada agente (aceite/recusa/contraproposta)

### E5 — Governança
- [ ] `docs/decisions.md` — registro formal de decisões (ADR-style)
- [ ] `docs/gotchas.md` — armadilhas conhecidas
- [ ] `docs/handoff.md` — estado para retomada entre sessões

## Backlog não priorizado
- Selo de qualidade GOS3 aplicado ao próprio vortex (dogfooding)
- CI automatizado validando contrato de invocação
- Documentação multi-idioma (pt-BR / en)
