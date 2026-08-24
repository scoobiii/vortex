# GPT Runtime Adapter

Conector server-side para OpenAI Responses API, integrado à fronteira Zero-Trust do Vortex.

## Credencial

`OPENAI_API_KEY` é consumida somente pelo runtime backend. Ela não entra no prompt, envelope de invocação, memória, logs, `evidence_hash` ou frontend.

Vortex e xAI podem apontar para a **mesma variável/secret** no respectivo runtime server-side. O segredo não deve ser copiado para o código nem enviado do xAI para o Vortex.

Em Cloud Run, prefira uma referência ao mesmo segredo no Secret Manager para cada serviço.

## Configuração

```sh
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.6
# opcional: OPENAI_BASE_URL=https://api.openai.com/v1
```

Se a chave estiver ausente, `invoke()` retorna `executed:false` e `claim:"not_executed"` sem realizar HTTP.

## Prova

Em respostas HTTP bem-sucedidas ou de erro da OpenAI, o adapter produz `evidence_hash` calculado sobre os dados observados da execução. A chave nunca participa desse hash.

## Teste

```sh
npx ts-node src/agents/gpt/tests/adapter.test.ts
```

O teste usa `fetch` falso para provar a fronteira da credencial e não consome créditos da OpenAI.
