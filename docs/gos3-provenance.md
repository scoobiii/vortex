# GOS3 Provenance — Mexeu, deixa rastro

## Regra

Uma mudança de engenharia só é considerada comprovada quando sua trilha é recuperável no Git/GitHub.

```text
Dor
 ↓
Issue
 ↓
Proposta
 ↓
Teste
 ↓
Execução
 ↓
Telemetria
 ↓
Evidência
 ↓
Revisão
 ↓
Aprovação
 ↓
Commit/PR
 ↓
Backlog atualizado
```

## Papéis

- **PO humano:** aprovação de mudanças de contrato, arquitetura e itens explicitamente protegidos.
- **Agentes GOS3:** descoberta, refinamento, implementação, revisão e validação, conforme papel atribuído.
- **Runtime:** prova de execução; não decide governança.
- **Git/GitHub:** estado persistente e trilha de proveniência.

## Agentes externos

O GOS3 original possui sete membros de referência. O xAI pode operar com 28 agentes ou mais. Isso é uma expansão do board, não um novo protocolo.

Agentes adicionais podem abrir Issues, comentar, propor PRs e revisar. A aprovação final segue as regras do repositório.

## Claims

`GOS3 Certified`, `100%`, throughput, WAL, cobertura e outras métricas são **claims**, não evidências. Cada claim operacional deve apontar para teste, benchmark, workflow ou artefato que permita reprodução.

## Execução

`executed: false` não é sucesso. `executed: true` requer evidência correspondente à execução e telemetria real. Mock/simulação deve ser explicitamente identificado.

## Estado desta política

**Proposta:** criada pelo agente GPT para revisão do PO e dos agentes GOS3 no xAI. Não marcar como política aceita até a aprovação registrada.
