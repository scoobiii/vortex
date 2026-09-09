# Contrato de invocação — v0.3 (GOS3 bounded execution + semantic verification)

> **GOS3** · Maintainer / Engineering Agent
> fase: `Runtime Federation / Semantic Verification` · data: `2026-09-09`
> base: v0.2
> mudança principal: separa prova de execução, integridade da evidência e correção semântica/determinística.

## Princípio

O contrato separa **LLM**, **VUA**, **runtime** e **Vortex**.

O LLM pode propor uma resposta ou ação. O runtime pode executar. O Vortex pode provar a execução e a integridade da evidência. **Nenhuma dessas etapas, isoladamente, prova que o resultado está semanticamente correto.**

```text
LLM / AGENT
    ↓ proposal / candidate
VUA CAPABILITY ROUTER
    ↓ select verifier when required
VORTEX GATEWAY
    ↓ identity + authorization + policy + scope + limits
RUNTIME / ADAPTER
    ↓ real execution
EVIDENCE
    ↓
INDEPENDENT VERIFICATION
    ├── execution integrity
    ├── evidence integrity
    └── semantic / deterministic verification (when applicable)
```

## Request

```json
{
  "contract_version": "0.3",
  "invocation_id": "uuid-v4",
  "agent": "string",
  "task": {
    "kind": "code_exec | shell | tool_call | llm_inference | image_measurement | data_transform",
    "payload": "string | object",
    "language": "string opcional"
  },
  "verification": {
    "required": false,
    "mode": "none | schema | deterministic | specialized | tests | domain_rule",
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
  "runtime_id": "string opcional na request; obrigatório quando fornecido pelo scheduler"
}
```

## Response

```json
{
  "contract_version": "0.3",
  "invocation_id": "uuid-v4",
  "agent": "string",
  "status": "success | error | partial | timeout | blocked",
  "executed": true,
  "claim": "executed | not_executed | failed | blocked",
  "verification": {
    "execution_verified": true,
    "evidence_integrity_verified": true,
    "semantic_verified": false,
    "verification_status": "NOT_REQUESTED | PASS | FAIL | NOT_PROVABLE",
    "mode": "none | schema | deterministic | specialized | tests | domain_rule",
    "capability_id": "string opcional",
    "check_id": "string opcional",
    "reason": "string opcional"
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
  "duration_ms": 123,
  "truncated": false,
  "loop": {
    "state": "READY | RUNNING | VERIFYING | RETRY | ROLLBACK | PR_READY | STAGNATED | HELP_REQUIRED",
    "attempt": 1,
    "max_attempts": 3,
    "last_good_commit": "sha opcional",
    "current_commit": "sha opcional",
    "evidence_hashes": ["sha256..."]
  },
  "help_request": null
}
```

## Regras normativas

1. `executed:false` nunca pode ser `status:success`.
2. `executed:true` exige `runtime.runtime_id`, `runtime.execution_id` e evidência verificável.
3. `execution_verified:true` significa somente que a execução observada e sua cadeia de evidência passaram os checks definidos pelo verificador.
4. `semantic_verified:true` **não pode** ser inferido de `execution_verified:true`, assinatura, hash, `status:success` ou resposta do LLM.
5. Quando `verification.required:true`, `semantic_verified:true` exige um verificador compatível, identificável por `capability_id`/`check_id`, e resultado `PASS`.
6. Se uma tarefa exige verificação semântica mas não existe capacidade verificadora adequada, o resultado deve ser `NOT_PROVABLE`, não `VERIFIED`.
7. `semantic_verified:false` não significa necessariamente que o resultado está errado; significa que a correção não foi provada pelo mecanismo especificado.
8. Para operações determinísticas, o verificador deve preferir cálculo, parser, schema validator, testes, compilador ou regra de domínio em vez de pedir ao mesmo LLM para certificar sua própria resposta.
9. Para medições de imagem, o pipeline deve separar percepção (`measurement_candidate`) de conversão/consistência determinística. Exemplo: `28 mm / 25.4 = 1.10236 in`; não é permitido normalizar automaticamente para `1 in` sem regra explícita.
10. Para perguntas de lógica, matemática e unidades, uma resposta plausível do LLM não é evidência suficiente de correção.
11. Mock/simulação nunca pode produzir `executed:true`.
12. `evidence_hash` identifica a evidência; não é um certificado de verdade semântica.
13. A assinatura Ed25519 prova autoria/integridade da prova conforme a política; não prova que o conteúdo do resultado é verdadeiro.
14. O VUA deve selecionar capacidades de verificação antes da execução quando a política determinar que a tarefa exige verificação.
15. Autorização, política, escopo e limites devem ser avaliados antes do adapter produzir qualquer side-effect.
16. `duration_ms` usado para benchmark deve representar explicitamente a janela medida. Quando houver latência do provider/LLM fora da janela de execução governada, ela deve ser registrada separadamente como `provider_duration_ms`/`wall_duration_ms`, evitando comparar métricas semanticamente diferentes.
17. `PR_READY` exige execução real, checks aplicáveis, verificação exigida pela política e evidência válida. `EXECUTION_SUCCESS` sozinho não autoriza `PR_READY`.

## Exemplo: problema das 17 ovelhas

```text
LLM → "8"
 ↓
VUA → deterministic/domain-rule verifier
 ↓
FAIL
 ↓
semantic_verified=false
 ↓
não promover para VERIFIED-CORRECT / PR_READY
```

## Exemplo: conversão de unidade

```text
measurement_candidate = 28 mm
conversion = 28 / 25.4
result = 1.102362... in
```

A conversão deve ser executada por uma capacidade determinística. A interpretação visual da imagem pode permanecer probabilística, mas a transformação e a regra de consistência não.

## Regra de verdade

```text
PROMISED → IMPLEMENTED → EXECUTED → EXECUTION_VERIFIED
                                             ↓
                         SEMANTIC_VERIFIED (quando aplicável)
```

Não usar `VERIFIED` como rótulo único quando o claim mistura integridade de execução e correção semântica.

## Critério de conformidade

Um implementation conforme deve possuir testes que demonstrem:

- execução válida → `execution_verified=true`;
- prova adulterada → falha de integridade;
- resposta semanticamente errada com execução íntegra → `semantic_verified=false`;
- ausência de verificador obrigatório → `NOT_PROVABLE`;
- verificador determinístico correto → `semantic_verified=true`;
- autorização avaliada antes do adapter com side-effect;
- benchmark separando `wall_duration_ms` da duração interna quando necessário.
