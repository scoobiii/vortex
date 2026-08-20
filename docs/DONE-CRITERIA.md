> **GOS3** · agente: `Grok` · papel: `Runtime Reference / Sandbox Validator`
> fase: `Sprint Prova — 3 gates` · data: `2026-08-20`
> antes: nota e incidents sem mapa operacional contrato→runtime→auditoria
> depois: três gates com checkboxes; nota 2/3 até Gate 1+2 verdes
> base: INC-001 + plano de salvação Molt Hub
> assinatura: `Grok · Runtime Reference · GOS3`

# Critério de pronto — régua única

**Nota atual: 2/3**

Não declarar 3/3 no README, feed ou post de agente.
Selo só com Gate 1 + Gate 2 + Gate 3 abaixo.

## Gate 1 — Contrato

- [ ] Spec única (`specs/invocation-contract.md`) — sem `spec/` duplicado divergente
- [ ] `executed: true` exige evidência (`evidence_hash` ou envelope equivalente)
- [ ] `executed: false` + `status: success` → **inválido**
- [ ] `validateResponse()` / `contract_test` rejeita forged / missing hash
- [ ] `runtime_id` documentado (local vs Cloud Run; distro/libc se possível) — INC-001

**Critério de passagem:** `python3 tests/contract_test.py` → PASS

## Gate 2 — Runtime

- [ ] Tool backend separado do V8 browser para APIs Node (`process.*`)
- [ ] Path real: stdout + exit_code + duration_ms reproduzíveis
- [ ] Código que depende de `process` **não** roda no isolate JS; ou claim = not_executed
- [ ] Pelo menos 1 adapter (`src/agents/<x>/`) gera response que o Gate 1 aceita
- [ ] Alpine/PRoot = opção de deploy, **não** requisito do contrato

**Critério de passagem:** 1 fixture/response real validada pelo gate + log de execução

## Gate 3 — Auditoria

- [ ] CI `gos3-compliance` (ou equivalente) verde no remoto
- [ ] Branch protection exige o status check
- [ ] Nota lida de **este arquivo**, não do feed do agente
- [ ] D9: aprovação humana para Official Agent; card UI ≠ runtime oficial
- [ ] INC-001 referenciado; regressão “100% + stdout exception” coberta por teste

**Critério de passagem:** PR/main só mergeia com CI verde + PO

## Mapa rápido

| Gate | Dono típico | Quem não carimba sozinho |
|------|-------------|---------------------------|
| 1 Contrato | Manus/Claude + Grok review | Agente que só gerou o adapter |
| 2 Runtime | Humano + Gemini/Grok implementando | Post no feed |
| 3 Auditoria | CI + PO | Qualquer LLM isolado |

## Produto vs contrato

| Repo | Papel |
|------|--------|
| [scoobiii/vortex](https://github.com/scoobiii/vortex) | Contrato, adapters, gate, incidents |
| [scoobiii/zAI](https://github.com/scoobiii/zAI) | Molt Hub (UI/feed/gateway) |

