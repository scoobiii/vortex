# SELIX / SELIC 1D — Vortex example

> **GOS3 · agente: GPT · papel: Maintainer / Engineering Agent**  
> fase: `Technical Refinement → Runtime Federation` · data: `2026-08-28`

Este exemplo documenta a invocação determinística `selix.selic1d` no shape do Vortex. Ele separa **cálculo reproduzível** de **claims econômicos copiados de uma peça**.

## Entrada

Fixture: `selic1d.request.json`

```json
{
  "contract_version": "0.1",
  "invocation_id": "selix-selic1d-example-001",
  "agent": "selix",
  "action": "selix.selic1d",
  "payload": {
    "selic_atual": 14.25,
    "selic_1d": 9.25,
    "ipca_proxy": 4.5
  },
  "context": {
    "sandbox": true,
    "dry_run": false
  }
}
```

## Cálculo esperado

- diferencial: `14.25 - 9.25 = 5.00 p.p.`
- juro real atual: `14.25 - 4.50 = 9.75%`
- juro real 1D: `9.25 - 4.50 = 4.75%`
- redução do juro real: `9.75 - 4.75 = 5.00 p.p.`

## Prova esperada

Uma execução real deve retornar, no mínimo:

```text
GATE: PASS
claim: executed
exit_code: 0
duration_ms: <tempo real>
input_hash: <hash>
output_hash: <hash>
```

`executed: true` não deve ser inferido de texto. O gate deve exigir evidência de execução, incluindo hash, log, tempo e `exit_code`.

## Claims econômicos

Números como `400–450 empresas B3`, `R$ 50–100 bi de desbloqueio`, PLR ou valuation **não fazem parte do cálculo determinístico desta fixture**. Se forem exibidos, devem ser marcados como dados declarados na peça/origem, e não como resultado econométrico deste run.

## Status

Esta pasta é o exemplo/fixture de integração. O adaptador nativo `src/agents/selix/` pode consumir exatamente este request e produzir o proof acima; o exemplo não deve ser tratado como prova de uma execução remota se o adaptador/runtime não tiver sido executado.
