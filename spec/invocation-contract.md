# Contrato de Invocação — v0.4

> GOS3 · Runtime Federation / Capability Orchestration / Semantic Verification
> Data: 2026-09-09
> Base: v0.3

## 1. Objetivo

Este contrato separa quatro propriedades que não podem ser confundidas:

```text
LLM inference      ≠ truth
capability success ≠ task success
execution proof    ≠ semantic truth
cryptographic hash ≠ correctness
```

O LLM pode propor uma resposta. O VUA seleciona capacidades para produzir, enriquecer ou verificar essa resposta. O Vortex governa a execução dessas capacidades e prova a integridade da cadeia de evidência.

O objetivo do Foundation Runtime é separar:

```text
modelo errado
runtime errado
ferramenta errada
verificador errado
```

como eventos observáveis e auditáveis, em vez de produzir um único `VERIFIED` ambíguo.

## 2. Arquitetura normativa

```text
REQUEST
   ↓
VUA TASK / CAPABILITY ROUTER
   ↓
CAPABILITY PLAN
   ├── LLM
   ├── local RAG / memory
   ├── web / search
   ├── external API
   ├── math / logic
   ├── vision / OCR / metrology
   ├── compiler / tests
   └── domain verifier
   ↓
VORTEX GATEWAY
   ↓
identity + authorization + policy + scope + limits
   ↓
REAL EXECUTION
   ↓
EVIDENCE GRAPH
   ↓
INDEPENDENT VERIFICATION
   ├── execution integrity
   ├── evidence integrity
   ├── semantic verification
   └── side-effect verification
   ↓
PASS / FAIL / NOT_PROVABLE
```

## 3. Request

```json
{
  "contract_version": "0.4",
  "invocation_id": "uuid-v4",
  "agent": "string",
  "task": {
    "kind": "code_exec | shell | tool_call | llm_inference | image_measurement | data_transform | research | reasoning",
    "payload": "string | object",
    "language": "string opcional"
  },
  "capability_plan": {
    "required": false,
    "primary": "capability.id",
    "fallbacks": ["capability.id"],
    "escalation_policy": "policy-id"
  },
  "verification": {
    "required": false,
    "mode": "none | schema | deterministic | specialized | tests | domain_rule | composite",
    "capability_id": "string opcional",
    "policy": "string opcional"
  },
  "limits": {
    "timeout_seconds": "int, obrigatório",
    "max_output_bytes": "int, obrigatório",
    "max_attempts": "int >= 1, obrigatório",
    "max_duration_ms": "int > 0, obrigatório"
  },
  "context_ref": "string opcional",
  "env_tag": "string",
  "runtime_id": "string opcional"
}
```

## 4. Response

```json
{
  "contract_version": "0.4",
  "invocation_id": "uuid-v4",
  "agent": "string",
  "status": "success | error | partial | timeout | blocked | not_provable",
  "executed": true,
  "claim": "executed | not_executed | failed | blocked | unverified",
  "verification": {
    "execution_verified": true,
    "evidence_integrity_verified": true,
    "semantic_verified": false,
    "verification_status": "NOT_REQUESTED | PASS | FAIL | NOT_PROVABLE",
    "mode": "none | schema | deterministic | specialized | tests | domain_rule | composite",
    "capability_id": "string opcional",
    "check_id": "string opcional",
    "reason": "string opcional"
  },
  "evidence": {
    "request_hash": "sha256:...",
    "sandbox_hash": "sha256:...",
    "toolchain_hash": "sha256:...",
    "candidate_output_hash": "sha256:...",
    "capability_evidence_hash": "sha256:...",
    "semantic_check_hash": "sha256:..."
  },
  "evidence_hash": "sha256 obrigatório quando houver evidência verificável",
  "runtime": {
    "runtime_id": "string",
    "execution_id": "string"
  },
  "output": {
    "stdout": "string",
    "stderr": "string",
    "exit_code": 0
  },
  "timing": {
    "wall_duration_ms": 123,
    "provider_duration_ms": 100,
    "governed_execution_duration_ms": 20,
    "verification_duration_ms": 3
  },
  "loop": {
    "state": "READY | RUNNING | VERIFYING | RETRY | ROLLBACK | HELP_REQUIRED | PR_READY | STAGNATED",
    "attempt": 1,
    "max_attempts": 3,
    "last_good_commit": "sha opcional",
    "current_commit": "sha opcional",
    "evidence_hashes": ["sha256..."]
  },
  "help_request": null
}
```

## 5. Normas de execução e prova

1. `executed:false` nunca pode ser `status:success`.
2. `executed:true` exige `runtime.runtime_id`, `runtime.execution_id` e evidência verificável.
3. `execution_verified:true` significa somente que a execução observada e sua cadeia de evidência passaram os checks definidos.
4. `semantic_verified:true` NÃO pode ser inferido de execução, assinatura, hash, HTTP 200, fluência ou confiança do LLM.
5. Quando verificação semântica for obrigatória, `semantic_verified:true` exige um verificador compatível, identificável por capability/check, com resultado `PASS`.
6. Ausência de verificador adequado produz `NOT_PROVABLE`.
7. `semantic_verified:false` não significa automaticamente que o resultado está errado; significa que a correção não foi provada.
8. Uma resposta semanticamente errada com execução íntegra deve permanecer auditável como execução válida + verificação semântica `FAIL`.
9. O sistema MUST preservar o candidato original quando uma verificação falhar.
10. Retry/correção MUST gerar nova identidade de tentativa/evidência; não pode sobrescrever silenciosamente a tentativa anterior.
11. Mock/simulação nunca pode produzir `executed:true` para uma operação declarada como real.
12. `evidence_hash` identifica evidência; não certifica verdade semântica.
13. Ed25519 certifica integridade/autoria da prova conforme a política; não certifica a verdade do resultado.
14. Autorização, política, escopo e limites devem preceder side-effects.
15. `PR_READY` exige execução real, checks aplicáveis, verificação exigida e evidência válida.

## 6. Evidence graph

O Vortex MUST distinguir os seguintes objetos:

```text
request
  │
  ├── request_hash
  ├── sandbox_hash
  ├── toolchain_hash
  ├── candidate_output_hash
  ├── capability_evidence_hash
  └── semantic_check_hash
           │
           ▼
     canonical evidence manifest
           │
           ▼
       execution_proof_hash
           │
           ▼
         signature
```

Um `sandbox_hash` identifica o ambiente/evidência da sandbox. Ele NÃO pode ser apresentado como `candidate_output_hash`.

Se dois outputs diferentes tiverem o mesmo `candidate_output_hash`, isso é um P0 de integridade e deve falhar independentemente de assinatura ou formato.

Se dois outputs diferentes tiverem o mesmo `sandbox_hash`, isso pode ser perfeitamente esperado: a sandbox pode ser a mesma enquanto os outputs mudam.

## 7. Independência do verifier

O processo que gera uma prova NÃO deve ser a única autoridade para validar a própria prova quando a política exigir verificação independente.

O verifier MUST recomputar, a partir dos dados recebidos:

- hashes aplicáveis;
- canonicalização;
- assinatura;
- binding entre request/input/output e evidência;
- política/escopo;
- replay/nonce;
- checks semânticos aplicáveis.

Um check que apenas valida que uma string começa com `sha256:` é um check de formato, não uma prova de conteúdo.

## 8. Capability routing e escalonamento

VUA seleciona a capacidade antes da execução quando a política exigir capacidade específica.

O LLM pode solicitar ajuda, mas não pode conceder a si próprio autorização.

```text
candidate
   ↓
capability router
   ↓
suitable verifier/tool
   ├── PASS → continue
   ├── FAIL → repair/replan
   └── NOT_PROVABLE → escalate
                           ↓
                  next authorized capability
                           ↓
                  stronger model / web /
                  API / specialist / human
                           ↓
                    bounded attempts
                           ↓
                    NOT_PROVABLE
```

Escalonamento é limitado por política, custo, rede, timeout, tentativas e escopo.

## 9. Web/search/API

Web/search é uma capacidade de aquisição de evidência externa.

VUA SHOULD selecionar essa capacidade quando a tarefa depende de informação atual, fonte externa, pesquisa explícita ou comparação de fontes.

A cadeia deve preservar:

```text
query
 ↓
query_hash
 ↓
source set
 ↓
sources_hash
 ↓
extracted evidence
 ↓
extracted_evidence_hash
 ↓
LLM synthesis
 ↓
candidate_output_hash
```

A presença de fontes não transforma automaticamente a síntese do LLM em verdade. Quando necessário, um verifier de fontes/conteúdo deve avaliar a afirmação.

## 10. Offline-first

A ausência de rede MUST NOT invalidar capacidades locais que não dependem dela.

```text
OFFLINE:
local LLM + RAG + math + logic + vision + compiler + rules

ONLINE:
OFFLINE capabilities
      + web/search
      + APIs
      + remote models
      + federation
```

A rede é uma capacidade autorizável, não requisito estrutural do runtime.

## 11. Timing

Os relógios MUST ser semanticamente distintos:

```text
wall_duration_ms
provider_duration_ms
governed_execution_duration_ms
verification_duration_ms
```

Uma execução que leva 32 segundos no relógio do cliente e apresenta 65 ms de execução governada NÃO pode usar `65 ms` como latência total do LLM.

Se a implementação não consegue medir uma janela, deve declarar essa limitação, não inventar equivalência.

## 12. Exemplos normativos

### 12.1 LLM errado, execução íntegra

```text
LLM → "180"
 ↓
units.convert.v1
 ↓
FAIL
 ↓
execution_verified=true
semantic_verified=false
overall=REJECTED
```

### 12.2 LLM correto, mas sem verifier

```text
LLM → "Canberra"
 ↓
nenhum verifier aplicável
 ↓
execution_verified=true
semantic_verified=false
verification_status=NOT_PROVABLE
```

### 12.3 Web search

```text
current-fact request
 ↓
VUA → web.search.v1
 ↓
Vortex authorization
 ↓
search execution
 ↓
evidence hashes
 ↓
LLM synthesis
 ↓
source/content verification
 ↓
PASS / FAIL / NOT_PROVABLE
```

## 13. Conformance tests

Uma implementação conforme MUST demonstrar:

1. outputs diferentes → `candidate_output_hash` diferentes;
2. recomputação offline do hash do candidato;
3. alteração do candidato → falha de binding/signature/evidence;
4. replay do mesmo `invocation_id`/nonce → rejeição conforme política;
5. timeout → status e `executed` coerentes;
6. Ollama/provider indisponível → não produzir `EXECUTION_SUCCESS` falso;
7. sandbox hash diferente de candidate output hash;
8. verifier independente recomputa hashes e binding;
9. check de formato não ser apresentado como check de conteúdo;
10. GOS3 session obrigatório ser efetivamente validado quando requerido pela policy;
11. duração wall/provider/governed separadas;
12. LLM semanticamente errado → semantic `FAIL` quando houver verifier;
13. ausência de verifier → `NOT_PROVABLE`;
14. web capability executada somente após authorization/policy;
15. evidência de web/API possuir identidade própria;
16. retry gerar nova evidência;
17. offline mode continuar funcionando para capabilities locais;
18. capability escalation ser limitada por policy.

## 14. Regra de verdade

```text
PROMISED
   ↓
IMPLEMENTED
   ↓
EXECUTED
   ↓
EXECUTION_VERIFIED
   ↓
EVIDENCE_INTEGRITY_VERIFIED
   ↓
SEMANTIC_VERIFIED   ← somente quando houver prova aplicável
   ↓
TASK_ACCEPTED
```

Nenhuma etapa posterior pode ser inferida automaticamente de uma etapa anterior.

## 15. Maturity

```text
M0 capability
 ↓
M1 contract + routing
 ↓
M2 real execution
 ↓
M3 independent verification
 ↓
M4 evidence graph + cryptographic proof
 ↓
M5 escalation/recovery
 ↓
M6 benchmark + CI/conformance
 ↓
M7 production federation
```
