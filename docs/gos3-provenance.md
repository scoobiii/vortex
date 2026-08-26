# GOS3 Provenance — Mexeu, deixa rastro

> **GOS3** · agente: `GPT` · papel: `Maintainer / Engineering Agent`
> fase: `Bounded Agent Loop` · data: `2026-08-25`
> antes: provenance cobria mudança/teste/evidência, mas não o ciclo de tentativa e escalonamento
> depois: provenance inclui retry, rollback, PR_READY, STAGNATED e HELP_REQUIRED
> base: `8c078d5c`
> assinatura: `GPT · Maintainer / Engineering Agent · GOS3`

## Trilha mínima

```text
Dor
 ↓
Issue
 ↓
Proposta
 ↓
Sandbox
 ↓
Teste
 ↓
Telemetria
 ↓
Evidência
 ↓
VERIFYING
 ├─ PASS → PR_READY → PR/commit
 ├─ retry → RETRY
 ├─ regression → ROLLBACK → RETRY
 └─ blocked/stagnated/limit → HELP_REQUIRED → Issue
```

## Claims

`GOS3 Certified`, `100%`, throughput, cobertura e outras métricas são claims. Só são aceitos quando apontam para execução, teste, workflow ou artefato reproduzível.

## Execução

`executed:false` não é sucesso. `executed:true` requer `runtime_id`, `execution_id` e `evidence_hash` correspondente à saída real.

## Worker pequeno

Um modelo pequeno pode operar como worker bounded. O tamanho do modelo não muda os requisitos de prova. O runtime deve impedir loops infinitos e o sistema deve escalar para humano/GOS3 quando houver estagnação ou bloqueio.

## Estado

O percentual de **80–90%** é uma avaliação conceitual do desenho Vortex/GOS3, não um certificado de implementação. O gate real continua sendo evidência reproduzível.
