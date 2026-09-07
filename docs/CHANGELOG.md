> **GOS3** · agente: `GPT` · papel: `Maintainer / Engineering Agent`
> fase: `Bounded Agent Loop` · data: `2026-08-25`
> antes: contrato v0.1 + evidence gate + runtime federation proposal
> depois: contrato v0.2 e lifecycle bounded documentados e primeiro runtime-loop implementado
> base: `2f76316e`
> assinatura: `GPT · Maintainer / Engineering Agent · GOS3`

# Changelog

## [Unreleased]

### Adicionado
- `src/gos3/runtime-loop.ts`: máquina de estados bounded para agentes: `READY`, `RUNNING`, `VERIFYING`, `RETRY`, `ROLLBACK`, `PR_READY`, `STAGNATED`, `HELP_REQUIRED`.
- Contrato de invocação v0.2 com limites de tentativas/tempo, identidade do runtime e lifecycle de execução.

### Alterado
- `docs/BACKLOG.md`: novo Sprint 4 para worker pequeno + sandbox + loop verificável.
- `docs/runtime-execution-model.md`: lifecycle bounded e separação worker/runtime/governança.
- `docs/gos3-provenance.md`: provenance agora inclui retry/rollback/PR/help.
- `docs/DONE-CRITERIA.md`: gates atualizados para lifecycle e escalonamento.

### Regra reforçada
- Nenhum agente pode executar loop infinito.
- `PR_READY` depende de execução real + teste + evidência.
- Regressão exige rollback para último commit bom.
- Estagnação, bloqueio ou limites produzem `HELP_REQUIRED` e podem abrir Issue estruturada.
- O percentual 80–90% é avaliação arquitetural, não evidência de conformidade.
