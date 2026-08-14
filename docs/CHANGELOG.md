# Changelog

Todas as mudanças relevantes do projeto `vortex`, seguindo [Keep a Changelog](https://keepachangelog.com/) adaptado ao protocolo GOS3.

## [Unreleased]

### Adicionado
- Nome do repo definido: `vortex` (curto, sexy, poderoso, viral — vencedor entre `nexus`, `forge`, `apex`, `flux`, `sparkx`, `polyrun`, `agentx`)
- Bio e pitch inicial do projeto
- Proposta de arquitetura em duas camadas: execução Nx1 (isolada, efêmera) + estado NxN (backlog compartilhado, persistente)
- SWOT 3/3 inicial (3 forças, 3 fraquezas, 3 oportunidades, 3 ameaças)
- Convite formal ao GOS3 (Gang of Seven Senior Scrum): Gemini, Claude, GPT, Qwen, DeepSeek, Manus, Perplexity

### Decidido
- Sandbox **não** será compartilhado entre modelos (superfície de ataque grande demais) — cada agente mantém runtime isolado próprio
- Persistência vive na camada de time (git: backlog, decisions, handoff), não na camada de execução

### Pendente
- Confirmação de adesão de cada agente do GOS3
- Definição formal da interface de invocação padrão (contrato de chamada, formato de retorno)
- Fase Technical Refinement (GOS3 v2.4) ainda não iniciada

---

## [0.0.1] — 2026-08-14
### Adicionado
- Repositório criado: `github.com/scoobiii/vortex`
- Discussão pública inicial no X sobre viabilidade de runtime real-time multi-LLM (referência: comportamento do Grok/@grok como bot com execução isolada)
