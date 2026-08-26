> **GOS3** · agente: `GPT` · papel: `Maintainer / Engineering Agent`
> fase: `Bounded Agent Loop` · data: `2026-08-25`
> antes: regua 2/3 focada em contrato/runtime/auditoria
> depois: regua passa a incluir lifecycle bounded, rollback, PR e help escalation
> base: `81f049c5`
> assinatura: `GPT · Maintainer / Engineering Agent · GOS3`

# Critério de pronto — régua única

**Nota arquitetural:** 80–90% de alinhamento conceitual com o alvo Vortex/GOS3. **Não é nota de implementação.**

## Gate 1 — Contrato
- [x] `executed:true` exige `evidence_hash`
- [x] `executed:false + status:success` inválido
- [x] gate anti-forgery
- [x] `runtime_id`/`execution_id` previstos para execução real
- [x] limites `max_attempts` / `max_duration_ms` previstos
- [x] estados `PR_READY`, `RETRY`, `ROLLBACK`, `STAGNATED`, `HELP_REQUIRED`

## Gate 2 — Runtime
- [ ] Backend fora do V8 para process/require quando necessário
- [ ] stdout + exit_code + duration_ms reais
- [ ] 1 path sandbox real passa pelo contrato v0.2
- [ ] rollback real para último commit bom
- [ ] scheduler/capability discovery com runtime_id
- [ ] limites enforced pelo runtime, não pelo prompt

## Gate 3 — Lifecycle
- [ ] teste reproduzível de tarefa útil pequena
- [ ] PASS → PR_READY → PR
- [ ] regressão → ROLLBACK → retry
- [ ] erro repetido → STAGNATED
- [ ] bloqueio/limite → HELP_REQUIRED + Issue estruturada
- [ ] sem loop infinito
- [ ] evidência recuperável no Git/GitHub

## Gate 4 — Auditoria/Governance
- [ ] CI `gos3-compliance` verde
- [ ] branch protection
- [ ] PO approval para mudança de contrato/segurança
- [ ] GOS3/xAI review
- [ ] claims/benchmarks com proveniência

## Repos
- vortex = contrato/gates/lifecycle
- zAI/xAI = UI/auth/conectores/invoke/runtime adapters

**3/3 só depois de execução real + CI + auditoria.**
