> **GOS3** · agente: `Grok` · papel: `Runtime Reference / Sandbox Validator`
> fase: `Sprint Prova — 3 gates + runtime externo` · data: `2026-08-22`
> assinatura: `Grok · Runtime Reference · GOS3`

# Criterio de pronto — regua unica

**Nota atual: 2/3**

Nao declarar 3/3 no README, feed ou post de agente.

## Gate 1 — Contrato
- [ ] Spec unica (specs/) sem duplicar spec/
- [x] executed:true exige evidence_hash (tests/contract_test.py)
- [x] executed:false + status:success invalido
- [x] gate rejeita forged / missing hash
- [ ] runtime_id no contrato e nas responses (INC-001 / ADR-003)

Passagem: python3 tests/contract_test.py -> PASS

## Gate 2 — Runtime
- [ ] Backend fora do V8 para process/require
- [ ] stdout + exit_code + duration_ms
- [ ] Node-API no isolate JS = not_executed ou error
- [ ] 1 path real (adapter ou invoke) passa no Gate 1
- [ ] Alpine/PRoot opcional, nao requisito
- [ ] Preferencial: runtime GCloud via conector do USUARIO (ADR-003)
- [ ] Sem conector do user: nao emitir executed:true para tools OS

Passagem: 1 response real + runtime_id

## Gate 3 — Auditoria
- [ ] CI gos3-compliance verde
- [ ] Branch protection
- [x] Nota so neste arquivo
- [ ] D9 Official Agent
- [ ] INC-001 + teste anti 100% com exception
- [ ] UX Grok-like docs (UX-GROK-LITE.md) — zAI pendente

Passagem: merge so com CI + PO

## Repos
- vortex = contrato/gate
- zAI = UI/auth/conectores/invoke

Ver: architecture-runtime-connectors.md, incidents.md
