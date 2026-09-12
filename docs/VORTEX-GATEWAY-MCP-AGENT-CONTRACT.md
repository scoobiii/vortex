# GOS3
# arquivo: docs/VORTEX-GATEWAY-MCP-AGENT-CONTRACT.md
# responsabilidade: contrato normativo entre Vortex Gateway, MCP, agentes executores e clientes externos
# agente: agent/llm
# papel: Engineering Agent
# fase: Gateway Federation → MCP Agent Authority
# data: 2026-09-08
# hora: 18:00
# antes: Gateway, MCP e agentes possuíam contratos separados, sem uma definição única de autoridade de execução
# depois: autoridade de execução, prova, baseline e conclusão ficam vinculadas ao Vortex Gateway
# base: commit:3d39ecc2242367d0b0089fdbc5a6a5fba8432e44
# assinatura: P0 scoobiii : Agente GPT
# commit: pending

# Vortex Gateway + MCP — Agent Authority Contract

## 1. Objetivo

Este documento é a especificação normativa para conectar agentes ao Vortex por meio do Gateway e, quando aplicável, do Model Context Protocol (MCP).

A regra fundamental é:

> **O agente propõe e executa; o Vortex Gateway verifica e decide.**

Nenhum cliente, modelo, prompt ou conector externo pode declarar uma tarefa `COMPLETED`, promover um baseline ou fabricar um `ExecutionProof` válido.

## 2. Estado atual de referência

Neste estágio, o **Qwen local** é o único agente tratado pelo Vortex como **agente executor soberano de referência**: ele possui caminho de execução local verificável e produz evidência de execução com hash. A implementação atual identifica a execução, registra runtime/modelo, mede duração, registra stdout/stderr, informa `executed` e calcula `evidence_hash` a partir da evidência observada.

Isso não significa que o modelo seja autoridade administrativa sobre o projeto. "Soberano" aqui significa somente **executor com autoridade operacional limitada pelo contrato e verificável pelo Gateway**.

O **Claude App** é tratado como **cliente MCP externo**. Ele pode consumir um conector MCP customizado do Vortex, enviar tarefas/invocações e receber resultados/evidências, mas não recebe autoridade para criar prova de execução nem para decidir o gate. A soberania permanece no Gateway/Vortex.

### 2.1 Matriz de autoridade

| Componente | Propõe tarefa | Executa localmente | Produz prova de execução | Decide PASS | Promove baseline |
|---|---:|---:|---:|---:|---:|
| Qwen local | sim | **sim** | **sim** | não | não |
| Claude App via MCP | sim | não necessariamente | não | não | não |
| MCP custom connector | transporte | não | não | não | não |
| Vortex Gateway | não | coordena | **verifica/aceita** | **sim** | **sim, sob gate** |

A matriz é deliberadamente assimétrica: **capacidade de falar com o Gateway não equivale a autoridade de execução**.

## 3. Separação de responsabilidades

```text
Claude App / outro cliente
        │
        │ MCP
        ▼
Vortex MCP Adapter
        │
        │ contrato normalizado
        ▼
Vortex Gateway
        │
        ├── Task Contract
        ├── Baseline Lock
        ├── Agent Runner
        ├── Execution Proof validation
        ├── Benchmark / regression gate
        └── Evidence Hash
        │
        ▼
Qwen local / executor autorizado
```

O MCP é uma **fronteira de transporte e descoberta de capacidades**. O contrato vinculante é definido pelo Vortex e aplicado depois da entrada MCP.

## 4. Contrato vinculante de tarefa

Toda execução iniciada por um agente deve estar associada a um `TaskContract` imutável para aquela tentativa:

```json
{
  "contract_version": "1",
  "task_id": "task-...",
  "repository": "scoobiii/vortex",
  "base_commit": "<commit>",
  "baseline": "LOCKED",
  "objective": "...",
  "acceptance": {
    "coverage": 100,
    "critical_security_findings": 0,
    "timeouts": 0,
    "stress_errors": 0,
    "real_execution": true,
    "evidence_hash": true,
    "baseline_comparison": true
  },
  "agent": {
    "id": "qwen-local",
    "authority": "EXECUTOR"
  },
  "execution": {
    "mode": "local_first",
    "offline_allowed": true
  }
}
```

O prompt pode variar entre iterações. O contrato não pode ser relaxado pelo agente.

## 5. O que constitui prova

Um resultado só pode ser aceito como `ExecutionProof` quando o Gateway consegue verificar, no mínimo:

1. identidade da tarefa e do commit-base;
2. identidade da execução;
3. executor/runtime;
4. `executed: true`;
5. resultado observável (`stdout`, `stderr`, exit code ou equivalente);
6. medição de execução;
7. hash determinístico da evidência;
8. vínculo com o contrato e a tentativa corrente.

A cadeia é:

```text
TASK CONTRACT
    ↓
EXECUTE
    ↓
OBSERVE
    ↓
MEASURE
    ↓
CANONICALIZE
    ↓
SHA-256
    ↓
EXECUTION PROOF
```

Um MCP response que apenas contém texto dizendo `executed=true` não é prova. A prova deve vir da implementação de execução confiável ou de uma autoridade de runtime explicitamente registrada pelo Gateway.

## 6. Regra para Claude via MCP

O Claude App pode chamar o Vortex por um conector MCP customizado. A operação deve ser modelada como:

```text
Claude
  → MCP tool call
  → Vortex MCP Adapter
  → TaskContract validation
  → Gateway
  → authorized executor
  → ExecutionProof
  → Gate decision
  → MCP response
```

O retorno para Claude deve separar claramente:

- `proposal`: o que o agente pediu;
- `execution`: o que realmente foi executado;
- `evidence`: prova e hashes;
- `decision`: `PASS`, `FAIL`, `RETRY`, `BLOCKED` ou `PAUSED`.

Claude não deve receber um campo que permita substituir `decision` ou `evidence`.

## 7. Baseline é uma trava do Gateway

Baseline não pertence ao agente.

```text
BASE COMMIT
    ↓
EXECUTE BASE
    ↓
MEASURE
    ↓
BASELINE HASH
    ↓
LOCK
    ↓
AGENT CHANGE
    ↓
EXECUTE HEAD
    ↓
COMPARE
    ↓
PASS → PROMOTE
```

O agente não pode escrever o baseline antes da comparação. O cliente MCP não pode sobrescrever um baseline `LOCKED`.

## 8. Loop e orçamento

A mesma política de loop vale para humanos e agentes.

### Local

O modo local é `adaptive`: novas tentativas são permitidas enquanto houver progresso verificável e enquanto os limites de segurança/recursos do host não forem excedidos.

### API / cliente remoto

O contrato deve impor orçamento explícito para:

- número máximo de iterações;
- tokens;
- wall-clock;
- custo, quando mensurável.

Ao esgotar o orçamento:

```text
SAVE STATE
  ↓
PERSIST EVIDENCE
  ↓
OPEN ISSUE / BLOCK
  ↓
STOP
```

Não existe política de "queimar tokens até resolver".

## 9. Máquina de estados

```text
CREATED
  ↓
CONTRACT_LOCKED
  ↓
BASELINE_LOCKED
  ↓
RUNNING
  ↓
VERIFYING
  ├── PASS ─────────→ COMPLETED
  ├── FAIL ─────────→ RETRY
  ├── NO_PROGRESS ──→ STRATEGY_CHANGE → RETRY
  ├── BUDGET_LIMIT ─→ BLOCKED → ISSUE
  └── INFRA_FAILURE → PAUSED
```

Somente o Gateway pode produzir a transição final para `COMPLETED`.

## 10. Regras de segurança do MCP adapter

O adapter MCP deve:

- aceitar somente operações definidas pelo contrato do Gateway;
- normalizar a identidade do conector;
- transportar `task_id`, `contract_version` e contexto de execução;
- rejeitar ausência de contrato quando a operação exigir prova;
- nunca aceitar `evidence_hash` fornecido pelo cliente como autoridade;
- nunca aceitar `baseline=promote` como comando unilateral do cliente;
- nunca transformar uma mensagem textual em `ExecutionProof`;
- retornar falha explícita quando a prova não puder ser verificada.

## 11. Teste mínimo desta especificação

O teste de contrato deve provar pelo menos:

1. Qwen local pode produzir evidência executada;
2. evidência executada possui hash;
3. uma resposta MCP/Claude não pode se autoelevar a executor soberano;
4. baseline permanece `LOCKED` até comparação;
5. `COMPLETED` exige `PASS + ExecutionProof + Evidence Hash`;
6. orçamento remoto pode produzir `BLOCKED` sem continuar consumindo recursos;
7. ausência de prova produz `FAIL`, nunca `PASS`.

O teste é de **contrato e autoridade**, não substitui o E2E real com Qwen local nem um teste de conectividade com Claude.

## 12. Regra de evolução

Quando outro agente passar a possuir execução local verificável, prova determinística e integração com o contrato vinculante, ele poderá ser promovido de `CLIENT`/`PROPOSER` para `EXECUTOR` por uma mudança explícita de capacidade e seus testes correspondentes.

Até lá, a implementação não deve declarar uma federação de agentes soberanos inexistente.
