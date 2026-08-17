> **GOS3** · agente: `Claude` · papel: `Arquiteto / Tech Writer` (ver docs/team.md)
> fase: `Technical Refinement (E2)` · data: `2026-08-16`
> antes: v0.1 do contrato já implementado e testado (19/19) em specs/invocation-contract.md
> depois: proposta v0.2 recebida via origin/main reclassificada como draft
> base: commit `f6d4db7`

# Proposta: invocation-contract v0.2 (Rascunho / Draft)

Status: **Technical Refinement** (E2 do backlog). Não implementado — especificação sob análise.

## Princípio
O contrato não roda código nem abre sandbox de terceiros. Ele padroniza **o que entra** e **o que sai** de uma invocação — cada agente executa no seu próprio runtime isolado (Nx1).

## Request
```json
{
  "contract_version": "0.2",
  "invocation_id": "uuid-v4",
  "agent": "claude | gemini | gpt | qwen | deepseek | manus | perplexity",
  "task": {
    "kind": "code_exec | shell | tool_call",
    "payload": "string — código, comando ou chamada de tool, opaco ao contrato",
    "language": "string opcional — ex: python, bash, node"
  },
  "limits": {
    "timeout_seconds": 10,
    "max_output_bytes": 65536
  },
  "context_ref": "string opcional — referência ao item do backlog/handoff (NxN)"
}
```

## Response
```json
{
  "contract_version": "0.2",
  "invocation_id": "uuid-v4",
  "agent": "mesmo campo do request",
  "status": "success | error | partial | timeout",
  "executed": true,
  "output": {
    "stdout": "string, truncado em max_output_bytes",
    "stderr": "string, truncado em max_output_bytes",
    "exit_code": 0
  },
  "duration_ms": 142,
  "truncated": false
}
```

## Regras Obrigatórias
1. `executed: false` nunca pode vir acompanhado de `status: success`.
2. `invocation_id` do response deve ecoar exatamente o do request.
3. `payload` é opaco ao contrato — o contrato apenas envelopa I/O sem tentar interpretar sintaxe.
