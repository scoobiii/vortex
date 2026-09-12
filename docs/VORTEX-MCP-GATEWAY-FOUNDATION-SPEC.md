# GOS3
# arquivo: docs/VORTEX-MCP-GATEWAY-FOUNDATION-SPEC.md
# responsabilidade: especificação normativa da fundação Vortex, MCP, Gateway, Bootstrap, adapters e VUA incremental
# agente: GPT
# papel: Maintainer / Engineering Agent
# fase: Runtime Federation → VUA Incremental
# data: 2026-09-08
# hora: 00:00
# antes: arquitetura distribuída entre README, Gateway, MCP connector e contratos de autoridade.
# depois: fundação normativa consolidada para MCP, Gateway, Bootstrap, adapters, GitHub e VUA incremental.
# base: commit:main
# assinatura: GOS3 Maintainer / Engineering Agent · GOS3
# commit: pending

# Vortex MCP + Gateway Foundation Specification

## Status

**Normative foundation specification.**

Esta especificação define a fundação arquitetural do Vortex para conexão de aplicações e agentes via MCP, execução através do Vortex Gateway, descoberta automática do ambiente, seleção de executores e evolução incremental para VUA.

O GitHub é parte obrigatória da arquitetura federada do Vortex para versionamento, CI, governança, PR, baseline e sincronização de evidências. A execução local não deve depender da disponibilidade momentânea do GitHub.

## 1. Princípio fundamental

```text
MCP          = interface de conexão
Bootstrap    = descoberta do ambiente
Capabilities = capacidade observável
Adapters     = adaptação ao ambiente/runtime
Selector     = seleção do executor
Gateway      = autoridade normativa
Executor     = execução
Proof        = evidência da execução
Benchmark    = medição
Hash         = identidade da evidência
Baseline     = referência
GitHub       = federação, CI e governança
VUA          = direção de convergência incremental
```

Nenhum modelo, aplicação cliente ou adapter possui autoridade intrínseca para declarar PASS, promover baseline ou concluir uma tarefa.

## 2. Vortex Gateway

O Gateway é a fronteira autoritativa do Vortex entre agentes, MCP, executores, conectores e serviços externos.

Responsabilidades normativas:

- validar Invocation Contract / Task Contract;
- aplicar policy e capability requirements;
- autorizar o executor selecionado;
- controlar execução e estado;
- produzir/validar ExecutionProof;
- validar Evidence Hash;
- controlar benchmark e baseline;
- decidir `PASS`, `FAIL` ou `BLOCKED`;
- impedir que um agente se auto-certifique;
- federar resultados com GitHub quando aplicável.

```text
CLIENT / AGENT
      ↓
      MCP
      ↓
VORTEX GATEWAY
      ↓
CONTRACT + POLICY
      ↓
EXECUTOR
```

## 3. MCP pertence ao Vortex

MCP é uma superfície de integração do Vortex. Ele não é o Gateway e não substitui o Gateway.

Uma aplicação pode conectar-se ao Vortex por MCP sem que GitHub seja o transporte da sessão:

```text
Claude / App / Agent
        │
        │ MCP
        ▼
   Vortex MCP
        │
        ▼
 Vortex Gateway
```

O cliente MCP solicita; o Gateway decide.

A aplicação cliente não recebe autoridade de prova apenas por estar conectada via MCP.

## 4. Bootstrap

O Bootstrap é a primeira camada operacional do Vortex.

Ele deve descobrir, sem depender de configuração manual quando possível:

- OS;
- arquitetura;
- CPU;
- memória;
- GPU;
- virtualização;
- containerização;
- conectividade;
- filesystem/runtime disponível;
- capacidade de execução local;
- sandbox;
- benchmark;
- stress;
- security;
- coverage;
- MCP;
- adapters instalados/disponíveis.

O Bootstrap produz uma descrição do ambiente e uma Capability Matrix.

```text
BOOTSTRAP
   ↓
ENVIRONMENT DISCOVERY
   ↓
CAPABILITY DISCOVERY
   ↓
ADAPTER DISCOVERY
   ↓
CAPABILITY MATRIX
```

## 5. Ambientes suportados

A arquitetura deve permitir adapters para:

- mobile;
- desktop;
- VM;
- VPS;
- server;
- CI;
- aplicações executadas nesses ambientes;
- clientes/aplicações MCP.

O tipo físico do ambiente é descritivo. O contrato de execução é baseado em capacidades.

```text
required_capabilities ⊆ available_capabilities
```

Ausência de uma capacidade obrigatória produz `BLOCKED`; não pode produzir PASS por fallback implícito.

## 6. Adapter model

Um adapter traduz as capacidades e operações de um ambiente/runtime para o contrato Vortex.

Adapters existentes permanecem válidos durante a migração para VUA.

```text
Environment
    ↓
Adapter
    ↓
Vortex Capability Contract
    ↓
Gateway
```

O adapter não pode alterar os critérios de prova do Gateway.

## 7. Executor Selection

A seleção é feita por capacidades e policy, não por nome do modelo ou classe de hardware.

```text
ENVIRONMENT
     ↓
CAPABILITIES
     ↓
POLICY
     ↓
COMPATIBLE EXECUTORS
     ↓
BEST APPROVED EXECUTOR
```

Qwen local é atualmente um executor de referência quando disponível; não é a autoridade arquitetural do Vortex.

MCP/remote pode ser selecionado quando o contrato e a conectividade permitirem. Em modo offline, executores que exigem rede devem ser filtrados.

## 8. GitHub federation

GitHub é obrigatório como camada federada de desenvolvimento e governança do Vortex.

A integração cobre, conforme o fluxo:

- repository/version control;
- branches;
- pull requests;
- CI;
- merge gates;
- baseline;
- ExecutionProof;
- benchmark;
- evidence hash;
- sincronização de resultados produzidos offline.

```text
LOCAL EXECUTION
      ↓
PROOF + BENCHMARK + HASH
      ↓
LOCAL QUEUE
      ↓
GITHUB WHEN CONNECTED
      ↓
CI / BASELINE / MERGE GATE
```

GitHub não deve ser requisito para iniciar uma execução local já autorizada. Ele é obrigatório para a federação, verificação e governança do ciclo de desenvolvimento.

## 9. Execution Proof

Uma execução somente é considerada evidência verificável quando existe informação suficiente para reconstruir o claim específico.

No mínimo, quando aplicável:

- execution/invocation id;
- executor;
- runtime/model;
- environment;
- input/context identity;
- stdout/stderr ou resultado estruturado;
- exit status;
- duração;
- timestamp;
- artefatos relevantes;
- hash da evidência.

`executed: true` sozinho não constitui prova universal de efeito externo.

## 10. Performance Benchmark

Performance é parte do gate quando exigida pelo contrato.

```text
EXECUTE
   ↓
MEASURE
   ↓
BENCHMARK
   ↓
CANONICALIZE
   ↓
PERFORMANCE EVIDENCE HASH
   ↓
BASELINE
   ↓
COMPARISON
   ↓
GATE
```

Métricas podem incluir:

- throughput;
- p50;
- p95;
- p99;
- erro;
- timeout;
- uso de CPU/memória;
- duração;
- métricas específicas do workload.

A benchmark evidence deve ser derivada da execução real. Mock não pode ser promovido a benchmark de runtime real.

## 11. Hash de performance

O hash de performance deve ser calculado sobre uma representação canônica da evidência produzida pelo benchmark.

```text
RAW EXECUTION DATA
       ↓
CANONICALIZATION
       ↓
SHA-256
       ↓
PERFORMANCE EVIDENCE HASH
```

O agente não escolhe nem preenche manualmente o hash.

O hash deve permitir detectar alteração da evidência após a execução.

O hash de commit Git identifica código; o Evidence Hash identifica a evidência produzida pela execução. Eles não são equivalentes.

## 12. Baseline

A baseline de performance deve ser identificada e protegida antes da comparação.

```text
BASE COMMIT
   ↓
REFERENCE EXECUTION
   ↓
REFERENCE BENCHMARK
   ↓
BASELINE HASH
   ↓
LOCK
```

Depois:

```text
CANDIDATE EXECUTION
   ↓
CANDIDATE BENCHMARK
   ↓
EVIDENCE HASH
   ↓
BASELINE COMPARISON
   ↓
PASS / FAIL
```

O executor não pode promover sua própria execução a baseline sem a política do Gateway.

## 13. VUA incremental

VUA é a direção de convergência arquitetural, mas a migração deve ser incremental e comprovada.

```text
EXISTING ADAPTER
       ↓
VUA IMPLEMENTATION
       ↓
UNIT
       ↓
INTEGRATION
       ↓
SECURITY
       ↓
100% COVERAGE
       ↓
STRESS / FAILURE
       ↓
REAL EXECUTION
       ↓
PERFORMANCE BENCH
       ↓
BASELINE COMPARISON
       ↓
EXECUTION PROOF
       ↓
EVIDENCE HASH
       ↓
GITHUB CI
       ↓
PROMOTION
```

O VUA não ganha autoridade por declaração. Cada capacidade deve demonstrar equivalência ou conformidade com o contrato Vortex antes de substituir o adapter de referência.

Durante a migração:

```text
LEGACY ADAPTER ─────┐
                    ├── SAME CONTRACT / SAME GATE
VUA IMPLEMENTATION ─┘
```

## 14. Truth model

```text
PROMISED
   ↓
IMPLEMENTED
   ↓
EXECUTED
   ↓
VERIFIED
```

A promoção entre níveis requer evidência correspondente.

## 15. Gate normativo

```text
PR
 ↓
BUILD
 ↓
UNIT + INTEGRATION + SECURITY
 ↓
100% COVERAGE
 ↓
STRESS + PERFORMANCE
 ↓
DEGRADATION / FAILURE
 ↓
REAL EXECUTION
 ↓
EXECUTION PROOF
 ↓
PERFORMANCE BENCH
 ↓
EVIDENCE HASH
 ↓
BASELINE COMPARISON
 ↓
GITHUB CI VERIFICATION
 ↓
MERGE
```

Quando um requisito obrigatório não puder ser demonstrado, o resultado é `FAIL` ou `BLOCKED`, conforme a natureza da falha.

## 16. Authority rule

```text
AGENT
  ≠ AUTHORITY

MCP CLIENT
  ≠ AUTHORITY

ADAPTER
  ≠ AUTHORITY

EXECUTOR
  ≠ AUTHORITY

VORTEX GATEWAY
  = AUTHORITY
```

A autoridade do Gateway é exercida por contratos, policy, execução observada e evidência verificável.

## 17. Foundation invariant

A fundação Vortex deve preservar estas invariantes:

1. MCP conecta; não certifica.
2. Bootstrap descobre; não autoriza.
3. Adapter traduz; não define a verdade.
4. Selector escolhe; não certifica.
5. Executor executa; não se auto-certifica.
6. Gateway autoriza e aplica o gate.
7. ExecutionProof registra a execução observada.
8. Benchmark mede o comportamento.
9. Performance Evidence Hash identifica a evidência canônica.
10. Baseline fornece a referência.
11. GitHub federa código, CI, governança e evidências.
12. VUA substitui adapters somente por migração incremental comprovada.

## 18. Target architecture

```text
                         VORTEX
                           │
                       BOOTSTRAP
                           │
                 ENVIRONMENT DISCOVERY
                           │
                  CAPABILITY DISCOVERY
                           │
                    ADAPTER DISCOVERY
                           │
                  EXECUTOR SELECTION
                           │
                      MCP / API
                           │
                    VORTEX GATEWAY
                           │
                 CONTRACT + POLICY
                           │
              ┌────────────┴────────────┐
              │                         │
         VUA INCREMENTAL          EXISTING ADAPTERS
              │                         │
              └────────────┬────────────┘
                           │
                       EXECUTION
                           │
                       MEASURE
                           │
              ┌────────────┴────────────┐
              │                         │
        EXECUTION PROOF          PERFORMANCE BENCH
              │                         │
              │                    EVIDENCE HASH
              │                         │
              └────────────┬────────────┘
                           │
                    BASELINE COMPARE
                           │
                         GATE
                           │
                        GITHUB
                           │
                     CI / MERGE
```

## 19. Definition of Done

Uma capacidade só pode ser marcada como concluída quando o claim correspondente estiver no nível de evidência apropriado:

```text
IMPLEMENTED
+
EXECUTABLE TEST
+
CI VERIFICATION
+
REAL EXECUTION (quando exigida)
+
BENCHMARK (quando exigido)
+
PROOF
+
EVIDENCE HASH
=
VERIFIED
```

Documentação isolada não promove uma capacidade para `VERIFIED`.
