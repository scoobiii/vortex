# Decisões — vortex (ADR-style)

Registro formal de decisões. Mudanças de contrato/arquitetura entram aqui com contexto, decisão, alternativas e aprovação.

## ADR-001 — Contrato de invocação + Technical Refinement
**Status:** Aceito

Fechar o gap entre conversa de agente e execução verificável através de um contrato comum Nx1/NxN.

---

## ADR-002 — Evidência em vez de claims
**Status:** Aceito

`executed:true` requer evidência real. Claims e ratings não substituem execução verificável.

---

## ADR-003 — Runtime externo e `runtime_id`
**Status:** Aceito (diretriz)

Preferir runtime externo/conector autenticado por usuário quando necessário. `runtime_id` é obrigatório em execução real.

---

## ADR-004 — UX Grok-like
**Status:** Aceito (diretriz)

Thread/compose como UX principal; falhas de sandbox devem ser visíveis.

---

## ADR-005 — Runtime Federation + Provenance
**Status:** Proposta — aprovação PO/GOS3 pendente

Separar Agent de Runtime, permitir N agentes, capability discovery, `runtime_id` e trilha `dor → issue → teste → execução → evidência → revisão → aprovação → commit/PR → backlog`.

---

## ADR-006 — Bounded Agent Loop
**Data:** 2026-08-25  
**Autor:** GPT  
**Status:** **Proposta para PO/GOS3 review**

### Contexto
A arquitetura Vortex/GOS3 já possui contrato, evidência e runtime federation, mas ainda faltava uma política explícita para agentes que iteram sobre código dentro de sandbox. Um worker pequeno pode ser útil se o sistema controlar o ciclo; autonomia sem limites cria loops, regressões e claims difíceis de auditar.

### Decisão proposta
1. Adotar estados `READY`, `RUNNING`, `VERIFYING`, `RETRY`, `ROLLBACK`, `PR_READY`, `STAGNATED`, `HELP_REQUIRED`.
2. `max_attempts` e `max_duration_ms` são hard limits aplicados pelo runtime/orquestrador.
3. PASS só chega a `PR_READY` com execução real + teste/verificação + evidência válida.
4. Regressão exige `ROLLBACK` para `last_good_commit` antes de retry.
5. Erro repetido/ausência de progresso termina em `STAGNATED`.
6. Bloqueio, estagnação ou limite termina em `HELP_REQUIRED`, com Issue estruturada contendo erro, commits e evidências.
7. Worker pequeno (ex.: Qwen Coder ~0,5B) é executor especializado, não autoridade de governança.
8. O percentual 80–90% é apenas avaliação arquitetural; não é critério de aceitação.

### Consequência
O contrato v0.2 e `src/gos3/runtime-loop.ts` materializam a máquina de estados. A integração com sandbox real, Git rollback, PR e Issue continua pendente de testes e aprovação.

---

**scoobiii/vortex · GOS3**
