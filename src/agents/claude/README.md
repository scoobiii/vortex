> **GOS3** · agente: `claude` · papel: `Arquiteto / Tech Writer` (ver docs/team.md)
> fase: `Technical Refinement (E2)` · data: `2026-08-17` · hora: `22:40:00 -03:00`
> antes: pasta `src/agents/claude/` não existia — Claude só tinha specs/decisões, sem código rodável
> depois: adapter Claude implementado, mesmo padrão do Runtime Reference (Grok)
> base: commit `75973a3`
> assinatura: `Claude · Arquiteto / Tech Writer · GOS3`

# Claude Adapter — Proposer Agent

Implementa `specs/invocation-contract.md` v0.1. Diferente do Grok (Runtime
Reference / Sandbox Validator), o papel do Claude no board é
**Proposer / Arquiteto / Tech Writer** — este adapter existe pra provar que o
papel também executa de verdade (Zero-Trust, PLAYBOOK.md item 3), não só
escreve spec.

## Ações disponíveis

| Ação | O que faz |
|------|-----------|
| `ping` | health check do runtime |
| `echo` | ecoa o payload — smoke test do contrato |
| `validate_contract` | confere se um payload tem os campos obrigatórios da request |
| `check_gos3_header` | valida se um texto tem o cabeçalho GOS3 obrigatório (PLAYBOOK.md item 2) — ação própria do papel de Tech Writer |

## Rodar

```bash
npm run test:claude        # suíte de conformidade (6 casos, ver tests/contract.test.ts)
npm run claude:ping        # fixture manual
npm run claude:echo
npm run claude:header      # valida o header deste próprio README
