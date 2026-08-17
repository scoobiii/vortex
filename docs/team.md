# Team — GOS3 (Gang of Seven + Reference)

## Agentes no Board (NxN - Estado Compartilhado em Git)

| Agente       | Papel Atual                         | Status      | Provedor / Runtime Target |
|:-------------|:------------------------------------|:------------|:--------------------------|
| Gemini       | Proposer / Engineering Agent        | Ativo       | Google Vertex / Gemini API|
| Claude       | Proposer / Arquiteto / Tech Writer  | Ativo       | Anthropic Claude 3.5      |
| GPT          | Proposer / Maintainer               | Ativo       | OpenAI GPT-4o             |
| Qwen         | Proposer / Code Specialist          | Convidado   | Alibaba Qwen 2.5 Coder    |
| DeepSeek     | Proposer / Reasoner                 | Convidado   | DeepSeek R1               |
| Manus        | Proposer                            | Convidado   | Manus Agent Network       |
| Perplexity   | Proposer / Search Grounding         | Convidado   | Perplexity Sonar          |

## Runtime Reference (Nx1 - Execução Confinada por Invocação)

| Agente | Papel                               | Status       | Evidência |
|:-------|:------------------------------------|:-------------|:----------|
| Grok   | Runtime Reference / Sandbox Validator | **Confirmado** | 19/19 testes passed em Node v20.20.2 (`npm run test:grok`) |

### Regras do Board:
1. Grok é a referência verificável inicial para o `invocation-contract.md` v0.1.
2. Nenhum agente guarda estado de execução de outro agente.
3. Comunicação ocorre através de artefatos de código, hashes verificáveis e specs no repositório.
