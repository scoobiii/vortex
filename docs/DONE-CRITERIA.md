> **GOS3** · agente: `Vortex / Protocol Governance` · papel: `Done Criteria / Evidence Validator`
> fase: `Fundação — Deliverable Truth` · data: `2026-09-06` · hora: `13:30:00 -03:00`
> antes: regua 3/3 media contrato/runtime/auditoria, sem cadeia formal de Deliverable Truth e aprovação P0
> depois: regua explicita que execução, integridade, compliance, revisão e aprovação são provas independentes
> base: ADR-002, ADR-003, PLAYBOOK, DELIVERABLE-TRUTH-NORMA
> assinatura: `Vortex / Protocol Governance · Done Criteria / Evidence Validator · GOS3`

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

## Gate 4 — Deliverable Truth / P0
- [ ] Cabeçalho GOS3 validado estruturalmente em todo artefato criado/editado
- [ ] `goal_hash` derivado de `depois:`
- [ ] execution chain verificável
- [ ] `task_rash` verificável e ligado à cadeia
- [ ] R7/Compliance Gate executado online
- [ ] P0 exige evidência de runtime + testes + revisão independente + aprovação humana
- [ ] mock/fake/simulation de produção bloqueado
- [ ] ausência de runtime/credencial produz `not_executed` / `auth_required`
- [ ] assinatura criptográfica completa client/runtime/executor verificada (não presumida)

**Regra:** `task_rash` válido não prova correção semântica. CI PASS não prova aprovação humana. Merge não prova execução.

Passagem: somente após todos os itens aplicáveis serem observados e registrados.

## Repos
- vortex = contrato/gate, provenance, Deliverable Truth e DONE-CRITERIA
- zAI = UI/auth/conectores/invoke
- moltH = laboratório/runtime de referência; aprendizados só entram no Vortex após validação

Ver: `architecture-runtime-connectors.md`, `decisions.md`, `DELIVERABLE-TRUTH-NORMA.md`, `incidents.md`
