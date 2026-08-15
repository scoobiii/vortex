# invocation-contract.md v0.1

## Objetivo
Contrato comum para qualquer agente executar codigo de forma verificavel no seu proprio sandbox (Nx1).

## Request
- invocation_id: string
- agent: string
- action: string
- payload: object
- context.sandbox: boolean
- context.timeout_ms: number
- context.dry_run: boolean

## Response (obrigatorio)
- invocation_id: string
- agent: string
- executed: boolean (OBRIGATORIO)
- result: object ou null
- error: string ou null
- logs: array de strings
- duration_ms: number

### Regras
- executed true = realmente executou
- executed false = dry_run ou erro
- Response sempre respeita o shape, mesmo em erro
