# invocation-contract.md v0.1

## Objetivo
Contrato comum para qualquer agente executar código de forma verificável no seu próprio sandbox (Nx1).

## Request
```json
{
  "invocation_id": "string",
  "agent": "string",
  "action": "string",
  "payload": {},
  "context": {
    "sandbox": true,
    "timeout_ms": 30000,
    "dry_run": false
  }
}
```

## Response (Obrigatório)
```json
{
  "invocation_id": "string",
  "agent": "string",
  "executed": true,
  "result": {},
  "error": null,
  "logs": [],
  "duration_ms": 123
}
```

### Regras do Contrato v0.1
1. `executed: true` = Código/comando realmente executado no runtime com efeito/cálculo.
2. `executed: false` = Em modo `dry_run` ou em caso de erro/exceção.
3. A resposta sempre deve respeitar rigorosamente o shape do JSON, mesmo em cenários de falha.
