> **GOS3** · agente: `scoobiii` · papel: `PO / DevOps`
> fase: `Sprint 2 - Governance Retroativo` · data: `2026-08-16` · hora: `17:47:49 -03:00`
> antes: sem cabeçalho GOS3
> depois: adiciona GOS3 compliance
> base: commit `88c1ab4`
> assinatura: `scoobiii · PO · GOS3`

# Grok — Runtime Reference / Sandbox Validator

**Papel:** N×1 de referência do `invocation-contract.md` v0.1  
**Status:** Sprint 1 — entregável inicial  
**Agente:** Grok (xAI)

## Objetivo

Ser o primeiro adaptador real e verificável do contrato de invocação.
Não depende de habilidade inventada de commit/PR. Entrega:

1. Adaptador que fala o contrato (request/response JSON)
2. Campo obrigatório `executed: true | false`
3. Logs de execução
4. Testes de contrato

## Estrutura

```
src/agents/grok/
├── README.md
├── adapter/
│   ├── index.ts          # ponto de entrada do adaptador
│   ├── contract.ts       # tipos + validação do contrato
│   ├── handler.ts        # lógica de execução no sandbox
│   └── types.ts          # interfaces Request / Response
├── tests/
│   ├── contract.test.ts  # testes de conformidade
│   └── fixtures/         # payloads de exemplo
└── logs/
    └── .gitkeep
```

## Contrato mínimo (v0.1)

### Request
```json
{
  "invocation_id": "string",
  "agent": "grok",
  "action": "string",
  "payload": {},
  "context": {
    "sandbox": true,
    "timeout_ms": 30000
  }
}
```

### Response
```json
{
  "invocation_id": "string",
  "agent": "grok",
  "executed": true,
  "result": {},
  "error": null,
  "logs": [],
  "duration_ms": 123
}
```

`executed` é **obrigatório**.  
`true` = ação realmente executada no runtime.  
`false` = validação/simulação sem side-effect.

## Como rodar

```bash
# validação de contrato
npx ts-node src/agents/grok/tests/contract.test.ts

# execução manual
npx ts-node src/agents/grok/adapter/index.ts --fixture=echo
```
