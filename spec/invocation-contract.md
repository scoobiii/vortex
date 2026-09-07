# Contrato de invocação — v0.2 (GOS3 bounded execution)

> **GOS3** · agente: `GPT` · papel: `Maintainer / Engineering Agent`
> fase: `Technical Refinement` · data: `2026-08-25`
> antes: v0.1 já exigia execução real + evidence_hash, mas não modelava o ciclo bounded de tentativa/rollback/escalonamento.
> depois: v0.2 adiciona identidade do runtime, limites do loop, estado terminal e evidência para retry/rollback/PR/help.
> base: commit `bd5a118`
> assinatura: `GPT · Maintainer / Engineering Agent · GOS3`

## Princípio

O contrato separa **LLM**, **runtime** e **governança**. O modelo pode propor; somente o runtime que realmente executou pode produzir `executed: true`. Toda autonomia é limitada por orçamento de tentativas e tempo. Não existe loop infinito.

## Request

```json
{
  "contract_version": "0.2",
  "invocation_id": "uuid-v4",
  "agent": "claude | gemini | gpt | grok | qwen | deepseek | manus | perplexity | ...",
  "task": {
    "kind": "code_exec | shell | tool_call",
    "payload": "string",
    "language": "string opcional"
  },
  "limits": {
    "timeout_seconds": "int, obrigatório",
    "max_output_bytes": "int, obrigatório",
    "max_attempts": "int >= 1, obrigatório",
    "max_duration_ms": "int > 0, obrigatório"
  },
  "context_ref": "string opcional",
  "env_tag": "browser-v8-isolate | node-linux | node-android-termux | unknown",
  "runtime_id": "string opcional na request; obrigatório quando fornecido pelo scheduler"
}
```

## Response

```json
{
  "contract_version": "0.2",
  "invocation_id": "uuid-v4",
  "agent": "string",
  "status": "success | error | partial | timeout",
  "executed": true,
  "claim": "executed | not_executed | failed | blocked",
  "evidence_hash": "sha256 obrigatório quando executed=true",
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

## Regras obrigatórias

1. `executed:false` **nunca** pode ser `status:success`.
2. `executed:true` exige `runtime.runtime_id`, `runtime.execution_id` e `evidence_hash` verificável.
3. `evidence_hash = sha256(stdout + stderr + str(exit_code) + str(duration_ms))`, hex lowercase.
4. O mesmo resultado/evidência não pode ser tratado como progresso indefinidamente. Repetição sem mudança observável termina em `STAGNATED` → `HELP_REQUIRED`.
5. `regression` exige preservação de `last_good_commit`; o próximo estado é `ROLLBACK` antes de nova tentativa.
6. `pass` somente pode produzir `PR_READY` quando execução real, testes/verificação e evidência forem válidos.
7. `blocked`, limite de tentativas ou limite de tempo terminam em `HELP_REQUIRED`; o agente deve produzir uma solicitação estruturada com erro, commits e evidências, não continuar em loop.
8. `max_attempts` e `max_duration_ms` são hard limits do runtime/orquestrador, não sugestões para o LLM.
9. `env_tag` descreve o ambiente real fornecido pelo adapter/scheduler. O modelo não pode inventá-lo.
10. `browser-v8-isolate` não pode alegar shell/Node/SO execution. Referências a APIs incompatíveis devem ser recusadas antes da execução.
11. Mock/simulação deve ser explicitamente identificada e nunca pode produzir `executed:true`.
12. Git/PR é proveniência e publicação; não é prova de execução por si só. A prova vem do runtime + testes + evidência.

## Máquina de estados GOS3

```text
READY → RUNNING → VERIFYING
                    │
       ┌────────────┼─────────────┐
       ▼            ▼             ▼
   PASS/PR_READY  RETRY       REGRESSION
                     │             │
                     └─────────────┘
                           ▼
                       ROLLBACK
                           │
                        RETRY

VERIFYING → STAGNATED → HELP_REQUIRED
VERIFYING → BLOCKED   → HELP_REQUIRED
VERIFYING → time/attempt limit → HELP_REQUIRED
```

O estado `HELP_REQUIRED` é o mecanismo de escalonamento humano/GOS3: registra a razão, última execução, último commit bom, commit atual e hashes de evidência. Não há autonomia ilimitada.

## Modelo operacional de agente pequeno

Um modelo coder pequeno (por exemplo, Qwen Coder ~0,5B) pode atuar como **worker bounded**. Ele não precisa ser o decisor global: recebe tarefa delimitada, opera no sandbox, testa, devolve evidência e passa pela máquina de estados. O Vortex/GOS3 fornece limites, rollback, publicação e escalonamento.

## Próximo passo

Implementar adapters que consumam este contrato, testes de máquina de estados, um executor sandbox real e integração de `PR_READY`/`HELP_REQUIRED`. A avaliação de conformidade permanece por evidência; a estimativa arquitetural de 80–90% não é um gate de aceitação.
