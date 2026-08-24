# GPT Runtime Adapter

Adapter do agente GPT para o contrato de invocação do Vortex.

## Estado

- `generate`: implementado contra `POST /v1/responses` da OpenAI.
- Sem `OPENAI_API_KEY`: `executed=false`, `status=not_executed`.
- `dry_run`: nunca chama a API.
- Execução real retorna `runtime_id` e `evidence_hash` derivados da resposta observada.
- Nenhuma credencial é persistida no repositório.

## Contrato

Entrada mínima:

```json
{
  "invocation_id": "gpt-001",
  "agent": "gpt",
  "action": "generate",
  "payload": {"input": "hello", "model": "gpt-5"}
}
```

A regra de governança é zero-trust: credencial ausente ou `dry_run` não pode ser apresentado como execução bem-sucedida.

## Teste seguro

Primeiro teste `dry_run` ou execução sem `OPENAI_API_KEY`. Teste com credencial deve ser explicitamente marcado como integração externa e não deve criar side effects fora do endpoint de inferência.
