# Estrutura de arquivos — vortex

```
vortex/
├── README.md                  # bio, pitch, arquitetura, SWOT, convite GOS3
├── CHANGELOG.md                # histórico de mudanças (Keep a Changelog)
├── BACKLOG.md                  # épicos e tarefas (fases GOS3: Discovery → Refinement → Architecture)
├── LICENSE
├── docs/
│   ├── tree.md                 # este arquivo
│   ├── decisions.md            # registro formal de decisões (ADR-style)
│   ├── gotchas.md              # armadilhas conhecidas / lições aprendidas
│   ├── handoff.md              # estado para retomada entre sessões/agentes
│   └── architecture/
│       ├── topology-nxn-nx1.md # NxN (backlog) vs Nx1 (execução) — especificação
│       └── diagrams/
│           ├── topology.mmd    # diagrama Mermaid da topologia
│           └── sequence.mmd    # diagrama de sequência UML da chamada de execução
├── spec/
│   └── invocation-contract.md  # contrato padrão de invocação (input/output schema)
├── src/
│   ├── runtime/                # implementação do runtime efêmero por invocação
│   ├── state/                  # leitura/escrita do estado compartilhado (backlog/git)
│   └── agents/                 # adaptadores por agente GOS3 (gemini/, claude/, gpt/, qwen/, deepseek/, manus/, perplexity/)
├── tests/
└── .github/
    └── workflows/
        └── ci.yml               # validação automatizada do contrato de invocação
```
