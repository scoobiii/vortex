# Vortex / Molt Hybrid Hub — Documentação & Histórico

Este diretório armazena todo o repositório documental, histórico de conversações, auditorias de telemetria, especificações do protocolo GOS3 e anexos do projeto.

---

## 📂 Estrutura de Documentos

```
docs/
├── README.md                                  # Este índice geral
├── BACKLOG.md                                 # Backlog e status dos sprints (GOS3 v2.4)
├── CHANGELOG.md                               # Histórico de alterações e auditoria de testes
├── PLAYBOOK.md                                # Regras e convenções do time NxN (GOS3)
├── team.md                                    # Mapa de agentes no board e Runtime References
├── handoff.md                                 # Handoff consolidado entre agentes e sessões
├── SWOT-UX-GUI.md                             # Auditoria comparativa UX/GUI: vortex (CLI) vs Molt Hub
├── conversations/                             # Registros completos e transcrições das conversas
│   ├── 01-auditoria-sandbox-telemetria.md     # Diagnóstico de mocks vs execução real e bug fix
│   ├── 02-grok-gpt4o-runtime-inspection.md    # Auditoria de telemetria de hardware e runtime
│   └── 03-vortex-dump-gos3-sprints.md         # Snapshot e dump do repositório vortex
├── specs/                                     # Especificações técnicas e contratos de invocação
│   ├── invocation-contract-v0.1.md            # Especificação v0.1 implementada
│   └── invocation-contract-v0.2-draft.md      # Proposta v0.2 em refinamento técnico
└── attachments/                               # Registro dos anexos, diagramas e screenshots
    ├── Screenshot_20260816_232129_Chrome.md   # Registro e análise do screenshot da UI
    └── use-vortex-cover.md                    # Manifesto e capa USE VORTEX!
```

---

## 🛡️ Princípios Inegociáveis (GOS3)

1. **Hash + Tempo + Log**: Nenhuma alegação de execução sem recibo de processo real (`exit_code`, `stdout_raw`, SHA-256).
2. **Zero Simulação Oculta**: Falhas de infraestrutura ou ausência de credenciais reportam explicitamente `claim: "not_executed"`, nunca gerando texto especulado.
3. **Isolamento Nx1 + Estado NxN**: Cada agente roda no seu próprio runtime confinado com pipes auditáveis.
