> **GOS3** · agente: `Vortex / Protocol Governance` · papel: `Deliverable Truth & Evidence` (ver docs/team.md)
> fase: `Fundação — DELIVERABLE-TRUTH e cadeia de execução` · data: `2026-09-06` · hora: `13:30:00 -03:00`
> antes: Vortex tinha evidência de execução e gates técnicos, mas não uma norma única ligando objetivo, cadeia, task_rash, compliance, revisão e aprovação.
> depois: norma canônica para impedir que hash, CI ou claims sejam tratados como prova semântica; define a cadeia mínima de verdade e os bloqueios P0.
> base: moltH ADR-006 DELIVERABLE-TRUTH-GATE; Vortex ADR-002/ADR-003/ADR-004; PLAYBOOK atual
> assinatura: `Vortex / Protocol Governance · Deliverable Truth & Evidence · GOS3`

# DELIVERABLE-TRUTH-NORMA

**Status:** norma canônica proposta no Vortex; implementação técnica ainda requer os gates correspondentes.

## 1. Cadeia de confiança

```text
OBJECTIVE
  ↓ goal_hash
EXECUTION CHAIN
  ├─ conteúdo
  ├─ ordem
  ├─ intenção
  └─ runtime_id
  ↓
task_rash
  ↓
R7 / CI
  ↓
INDEPENDENT REVIEW
  ↓
HUMAN APPROVAL
  ↓
MAIN
```

`goal_hash` deve ser derivado do objetivo/responsabilidade declarada no cabeçalho GOS3 (`depois:`). `task_rash` é o identificador da cadeia final e deve ser verificável a partir dos registros comprometidos.

## 2. O que cada prova significa

| Prova | O que estabelece | O que NÃO estabelece |
|---|---|---|
| `goal_hash` | qual objetivo textual foi vinculado | que o objetivo foi resolvido |
| execution chain | conteúdo, ordem e identidade declarada dos passos | correção semântica |
| `task_rash` | integridade da cadeia registrada | qualidade/valor da solução |
| R7 / CI | regras e testes automatizados observáveis | aprovação humana |
| testes | resultado dos testes executados | que o teste é suficiente |
| independent review | análise independente | execução real por si só |
| human approval | decisão humana de adequação | prova de execução |
| `main` | publicação efetiva | correção por si só |

## 3. Inequações obrigatórias

```text
task_rash válido ≠ solução correta
R7 PASS ≠ dor resolvida
CI PASS ≠ aprovação humana
APPROVAL ≠ execução
MERGE ≠ evidência de execução
```

> **Hash prova identidade e integridade do registro; não prova significado, correção semântica ou valor da solução.**

## 4. Deliverable Truth e mocks

CI técnico não substitui a verificação do entregável real. Fixtures/mocks são permitidos no escopo de teste, mas não podem ser usados como implementação de produção em domínios protegidos.

Domínios P0 incluem, no mínimo: `wallet`, `PIX`, `DREX`, `financial`, `banking`, `payment`, `settlement`, `balance`, `account`, `secret`, `credential`, `authentication`, `authorization` e `security` quando a mudança atingir fluxo/implementação de produção.

Ausência de integração/credencial real deve produzir estado explícito como `not_executed` / `auth_required`; nunca um sucesso simulado.

## 5. Ciclo de correção

A descoberta de erro não autoriza apagar/substituir silenciosamente o artefato para fazer o CI passar.

```text
INCIDENT
  ↓
BLOCK / QUARANTINE
  ↓
CORRECTION
  ↓
INDEPENDENT REVIEW
  ↓
CI
  ↓
COMPLIANCE PASS
  ↓
HUMAN APPROVAL
  ↓
MAIN
```

Regra operacional: **MEXEU → ACHOU ERRO → CONSERTA**.

## 6. Cabeçalho GOS3

O cabeçalho é propriedade do artefato. O scanner deve validar estruturalmente o cabeçalho no topo do arquivo, incluindo `agente`, `papel`, `fase`, `antes`, `depois`, `base` e `assinatura`. A presença solta da palavra `GOS3` não é suficiente.

`depois:` é a declaração de responsabilidade/objetivo do artefato e é a fonte normativa do `goal_hash`.

## 7. Regra de publicação

Nenhum agente pode declarar `PASS`, `implemented`, `complete` ou `production-ready` quando o entregável estiver bloqueado por Deliverable Truth.

Para P0, a cadeia mínima antes de `main` é:

**evidência de runtime → testes → compliance → revisão independente → aprovação humana → publicação.**

Esta norma não declara que essas provas já estão implementadas no Vortex. Ela define o contrato que as futuras implementações e o CI deverão fechar.
