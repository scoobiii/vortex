# GOS3
# arquivo: docs/VORTEX-DEVELOPMENT-LOOP-GOVERNANCE.md
# responsabilidade: definir o loop de desenvolvimento, baseline, trava de progresso e orçamento de tentativas do Vortex
# agente: agent/llm
# papel: Engineering Agent
# fase: governance / development loop
# data: 2026-09-08
# hora: 00:00
# antes: loop de desenvolvimento e política de desistência não estavam consolidados em um único contrato documental
# depois: loop, baseline, limites local/API e abertura de issue ficam explicitamente definidos
# base: main
# assinatura: GOS3 Maintainer / Engineering Agent
# commit: registered by Git

# Vortex Development Loop & Governance

## 1. Objetivo

O Vortex usa um **loop operacional contínuo** com **metas finitas por mudança, versão ou milestone**.

A regra é:

```text
META
  ↓
IMPLEMENTAR
  ↓
BUILD
  ↓
UNIT + INTEGRATION + SECURITY
  ↓
COVERAGE = 100%
  ↓
STRESS + FAILURE + DEGRADATION
  ↓
REAL EXECUTION
  ↓
BENCHMARK MÍNIMO
  ↓
BASELINE
  ↓
EXECUTION PROOF
  ↓
EVIDENCE HASH
  ↓
CI GATE
  ↓
PASS ───────────────→ PRÓXIMA META
  │
  └─ FAIL → DIAGNÓSTICO → CORREÇÃO → NOVO LOOP
```

O loop não significa repetir indefinidamente a mesma tentativa. Cada iteração deve produzir **nova informação verificável** ou terminar por uma política explícita de parada.

---

## 2. O que entra no cabeçalho GOS3

Todo arquivo de texto alterado pelo desenvolvimento deve possuir o cabeçalho GOS3 exigido pelo gate do repositório nos primeiros 20 linhas.

Formato canônico:

```text
# GOS3
# arquivo: <caminho relativo no repositório>
# responsabilidade: <responsabilidade objetiva do arquivo>
# agente: <agente ou autor>
# papel: <papel>
# fase: <fase do desenvolvimento>
# data: YYYY-MM-DD
# hora: HH:MM
# antes: <estado anterior verificável>
# depois: <estado produzido pela alteração>
# base: <commit/ref/contrato usado como base>
# assinatura: <identidade/papel GOS3>
# commit: <SHA real quando registrado; pending antes do commit>
```

### Regras

1. `arquivo` identifica o caminho real no repositório.
2. `antes` e `depois` descrevem mudança, não intenção futura.
3. `base` deve apontar para uma base real.
4. `commit` não deve ser inventado: pode ser `pending` antes do commit e deve ser registrado pelo Git depois.
5. Quando o arquivo possuir sintaxe que exige outra forma de comentário, o mesmo contrato deve ser expresso com o marcador GOS3 compatível com aquela linguagem.
6. O cabeçalho não substitui testes, Execution Proof, benchmark ou CI.

---

## 3. Onde fica a trava do baseline

A **trava do baseline** fica entre a medição e a decisão de regressão:

```text
EXECUÇÃO
  ↓
MEDIÇÃO
  ↓
CANONICALIZAÇÃO
  ↓
EVIDENCE HASH
  ↓
BASELINE LOCK  ← trava
  ↓
COMPARAÇÃO DA PRÓXIMA EXECUÇÃO
```

O baseline não é uma opinião do desenvolvedor e não deve ser digitado manualmente como resultado de benchmark.

### 3.1 Baseline de referência

Uma execução válida produz:

- commit SHA;
- CI run ID, quando executada em CI;
- suite/version;
- ambiente;
- testes e resultados;
- cobertura;
- segurança;
- stress/failure/degradation;
- throughput;
- p50;
- p95;
- p99;
- error rate;
- timeout;
- hashes dos artefatos de evidência.

Esses dados são canonicalizados e recebem um SHA-256 de evidência.

```text
EXECUTE → MEASURE → CANONICALIZE → SHA-256
```

O resultado aprovado pode se tornar o **baseline da próxima comparação**.

### 3.2 O que fica travado

A trava deve impedir que uma execução subsequente altere silenciosamente sua própria régua.

Em termos operacionais:

```text
BASELINE B
   │
   ├── métricas B
   ├── política B
   ├── commit B
   └── evidence hash B
          │
          ▼
EXECUÇÃO C
          │
          ▼
COMPARAR C × B
          │
      PASS / FAIL
```

Se C passar, C pode substituir B **somente como uma nova versão explícita do baseline**, com sua própria evidência. Não se deve reescrever B para fazer uma regressão desaparecer.

---

## 4. Régua mínima de benchmark

A régua inicial do Vortex é:

| Métrica | Regra inicial |
|---|---:|
| Build | PASS |
| Unit | PASS |
| Integration/Contract | PASS |
| Security | PASS |
| Coverage | 100% |
| Stress | 0 erros críticos |
| Real execution | PASS |
| Timeout | 0 |
| Error rate crítico | 0% |
| Throughput | não piorar > 2% |
| p95 latency | não piorar > 5% |
| p99 latency | não piorar > 10% |
| Security findings críticos | 0 |
| Evidence hash | obrigatório |
| Baseline | obrigatório |

A política deve ser configurável por métrica, mas a comparação precisa ser determinística e registrada na evidência.

---

## 5. Loop: humano e agente usam a mesma régua

Não existe um gate especial para código produzido por agente.

```text
HUMANO ─┐
        ├──→ VORTEX GATE ──→ PASS / FAIL
AGENTE ─┘
```

A autoria explica quem produziu a mudança. A execução prova se a mudança funciona.

```text
INTENÇÃO       ≠ PROVA
IMPLEMENTAÇÃO  ≠ PROVA
TESTE ISOLADO  ≠ PROVA COMPLETA

EXECUÇÃO + MEDIÇÃO + EVIDÊNCIA = PROVA
```

---

## 6. Política de tentativas: local versus API

O loop precisa de um **orçamento de tentativa**, mas esse orçamento não deve ser igual para execução local e execução por API.

### 6.1 Execução local

Local-first significa que o desenvolvedor ou agente pode continuar iterando enquanto houver recursos locais e enquanto cada iteração estiver produzindo progresso verificável.

Não há necessidade de impor um número artificial baixo de loops por causa de tokens de API.

Ainda assim, deve existir uma trava de segurança contra loop improdutivo.

Regra recomendada:

```text
LOCAL
→ tentativas variáveis
→ continuar enquanto houver progresso
→ detectar repetição/improdutividade
→ mudar estratégia
→ se persistir sem progresso: abrir issue
```

O critério não é simplesmente `N tentativas`. Deve considerar:

- novo erro resolvido;
- nova cobertura obtida;
- nova falha reproduzida;
- nova evidência produzida;
- melhoria de benchmark;
- redução de regressão;
- mudança efetiva de estratégia.

Repetir exatamente a mesma ação sem produzir informação nova é um **loop improdutivo**.

### 6.2 Execução via API

Quando cada iteração consome tokens, dinheiro ou quota, deve existir um orçamento explícito.

Modelo:

```text
API LOOP BUDGET
├── max_iterations
├── max_tokens
├── max_wall_time
└── max_cost (quando disponível)
```

A execução termina quando qualquer limite obrigatório for atingido.

A política padrão recomendada é **falhar de forma controlada**, preservando os artefatos já produzidos e abrindo uma issue para continuação humana/assíncrona.

Não se deve "torrar todos os tokens" tentando indefinidamente a mesma correção.

---

## 7. Quando desistir e abrir Issue

A parada é obrigatória quando ocorrer qualquer uma destas condições:

1. orçamento de API atingido;
2. wall-clock máximo atingido;
3. nenhuma melhoria verificável após um número configurado de ciclos;
4. o mesmo erro/assinatura de falha reaparece sem mudança de estratégia;
5. o benchmark permanece fora da tolerância após tentativas significativas;
6. a correção exige decisão arquitetural ou humana não determinada pelo contrato;
7. o ambiente necessário não está disponível;
8. o bloqueio depende de credencial, serviço externo ou recurso que não deve ser fabricado pelo agente.

A issue deve registrar, no mínimo:

```text
objetivo
commit/base
último estado conhecido
falha reproduzida
iterações realizadas
limites consumidos
último evidence hash
baseline comparado
hipóteses já tentadas
próximo passo recomendado
```

A issue é uma **continuação do estado de execução**, não um descarte silencioso do trabalho.

---

## 8. Detecção de loop improdutivo

Um contador simples de iterações não é suficiente.

Cada iteração deve poder ser classificada como:

```text
PROGRESS
NO_PROGRESS
REGRESSION
BLOCKED
PASS
```

Exemplo de regra:

```text
if PASS:
    stop_success()

if BLOCKED:
    open_issue()

if API_BUDGET_EXCEEDED:
    persist_state_and_open_issue()

if NO_PROGRESS >= configured_limit:
    change_strategy()

if NO_PROGRESS persists after strategy changes:
    open_issue()
```

O `configured_limit` deve ser ajustável por projeto e tipo de tarefa. Não deve ser embutido como uma verdade universal no código do Vortex.

---

## 9. Estado persistente entre loops

Cada iteração deve preservar estado suficiente para que o próximo loop não precise redescobrir o trabalho.

```text
loop-state.json
├── objective
├── iteration
├── strategy
├── base_commit
├── current_commit
├── failures
├── resolved_failures
├── benchmark
├── baseline
├── evidence_hash
├── token_budget (API)
├── elapsed_time
└── next_action
```

No modo local, esse estado deve permanecer utilizável offline.

Quando houver conectividade, o Universal Connector pode sincronizar Execution Proofs e benchmarks para o GitHub. GitHub não é requisito para executar o loop.

---

## 10. Regra de promoção de baseline

Somente uma execução **PASS** pode criar um novo baseline.

```text
CANDIDATE
   ↓
ALL GATES PASS
   ↓
EXECUTION PROOF
   ↓
EVIDENCE HASH
   ↓
BASELINE PROMOTED
```

Uma execução FAIL nunca deve virar baseline apenas para reduzir a regressão aparente da próxima execução.

O baseline deve ser imutável como referência histórica. Uma promoção cria uma nova versão.

---

## 11. Política de parada resumida

### Local

```text
continuar
  ↓
progresso?
 ├─ sim → novo loop
 ├─ não → mudar estratégia
 └─ bloqueado/persistente → issue
```

### API

```text
continuar
  ↓
PASS?
 ├─ sim → terminar
 └─ não
      ↓
 orçamento restante?
 ├─ sim → próximo loop
 └─ não → persistir evidência + abrir issue
```

### Nunca fazer

```text
FAIL
 ↓
repetir exatamente a mesma tentativa
 ↓
repetir
 ↓
repetir
 ↓
consumir todo orçamento
 ↓
sem nova evidência
```

Esse padrão é considerado loop improdutivo.

---

## 12. Integração com o Vortex

A implementação pode ser concentrada em um gate executável, por exemplo:

```text
scripts/vortex-gate.mjs
```

Responsabilidades:

1. executar as suítes obrigatórias;
2. verificar cobertura;
3. executar segurança;
4. executar stress/failure/degradation;
5. executar benchmark mínimo;
6. carregar baseline;
7. comparar métricas;
8. gerar Execution Proof;
9. canonicalizar a evidência;
10. calcular Evidence Hash;
11. produzir resultado PASS/FAIL;
12. persistir estado do loop;
13. devolver código de saída não-zero em falha.

Artefatos esperados:

```text
artifacts/
├── execution-proof.json
├── benchmark.json
├── security.json
├── coverage.json
├── degradation.json
├── baseline.json
├── evidence.json
├── evidence.sha256
└── loop-state.json
```

A CI deve verificar esses artefatos e o vínculo com o commit/run. O modo local pode produzir os mesmos tipos de evidência sem depender de GitHub.

---

## 13. Princípio final

O Vortex não usa um loop infinito cego.

Ele usa:

```text
LOOP CONTÍNUO
+
METAS FINITAS
+
BASELINE TRAVADO
+
ORÇAMENTO DE TENTATIVAS
+
DETECÇÃO DE IMPRODUTIVIDADE
+
EVIDÊNCIA PERSISTENTE
+
ISSUE QUANDO BLOQUEADO
```

A regra operacional é:

> **Toda mudança termina em evidência. Toda execução aprovada estabelece uma referência. Toda referência define a régua da próxima mudança. Quando o loop deixa de produzir progresso, o estado é preservado e o problema é escalado — nunca escondido por repetição.**
