# Decisões — vortex (ADR-style)

Registro formal de decisões, seguindo `docs/team.md`: toda mudança de contrato ou arquitetura entra aqui, com data, contexto, decisão e alternativas descartadas.

## ADR-001 — Corrigir links quebrados do README + abrir Technical Refinement

**Data:** 2026-08-14
**Autor:** Claude (Arquiteto / Tech Writer)
**Status:** Aceito

### Contexto
Revisão externa (Grok, thread pública no X) deu nota 2/3 ao README: estrutura clara, mas `BACKLOG.md` e `docs/decisions.md` linkados no README não existiam — `BACKLOG.md` real está em `docs/BACKLOG.md`, e `docs/decisions.md` nunca tinha sido criado. Zero interface concreta (nenhum contrato de invocação especificado ainda).

### Decisão
1. Corrigir os dois links no README (`README.md` → aponta pra `docs/BACKLOG.md` e `docs/decisions.md`, ambos agora existentes).
2. Adiantar `spec/invocation-contract.md` v0.1 (rascunho) como resposta direta ao "zero interface concreta" — mesmo com Discovery (E1) ainda não 100% fechado, o gap mais citado na crítica externa é o contrato ausente.
3. Este arquivo (`docs/decisions.md`) passa a existir a partir de agora — decisões anteriores (nome do repo, arquitetura Nx1/NxN, convite GOS3) já estão documentadas no `docs/CHANGELOG.md` e não são retroativamente migradas pra cá.

### Alternativas descartadas
- Esperar Discovery (E1) fechar 100% antes de tocar em Technical Refinement (E2): descartado porque o link quebrado e a ausência de interface são bugs de credibilidade imediatos, não dependem de E1 estar completo.
- Reescrever o SWOT do README para refletir a nota externa 2/3: descartado — o "SWOT 3/3" do README é uma métrica de completude da própria análise (3 itens por categoria), não uma autoavaliação de qualidade do repo. Não confundir os dois números.

### Consequência
`docs/BACKLOG.md` E2 ("Especificar contrato de invocação") ganha um primeiro rascunho antes do fim de E1. Próximo agente que mexer no contrato deve abrir um novo ADR aqui, não editar o v0.1 in-place sem registro.

---

## ADR-002 — Sprint "Prova 3/3": recusar SWOT 3/3 e nota AAA infladas, entregar gate real

**Data:** 2026-08-14
**Autor:** Claude (Arquiteto / Tech Writer)
**Status:** Aceito

### Contexto
Pedido do usuário: declarar cobertura de testes 100% e SWOT 3/3 / rating AAA via "sprint de engenharia de prompt". Grok (via thread pública) recusou a alegação com tabela objetiva: cobertura 100% não existe, CI/branch protection incompletos, evidência de `executed` ainda é dívida — nota honesta 2/3, e subir a nota exige "engenharia de prova e gate", não prompt engineering.

### Decisão
Concordar com a recusa do Grok e entregar a parte executável dos 5 itens do "Sprint Prova 3/3" no mesmo turno, não só documentar a intenção:
1. `evidence_hash` obrigatório em `executed: true` — adicionado ao contrato v0.1 (regra 2)
2. Teste que falha sem evidência (e falha com evidência forjada) — `tests/contract_test.py`, com self-test rodado e resultado colado neste ADR (ver `docs/CHANGELOG.md`)
3. Workflow `gos3-compliance` — `.github/workflows/gos3-compliance.yml`
4. Registro D9 (Official Agent vs. card de UI) — **não fechado**, só registrado como pendência em `docs/DONE-CRITERIA.md`; não há informação suficiente neste repo pra especificar isso agora
5. Critério de pronto escrito e mensurável — `docs/DONE-CRITERIA.md`, com nota honesta declarada: 2/3

### Alternativas descartadas
- Marcar SWOT 3/3 ou AAA agora, prometendo "fechar depois": descartado — é exatamente a prática que o Grok e o usuário identificaram como errada. Nota some fica presa ao commit que a sustenta, não a um sprint de prompt.
- Automatizar branch protection do GitHub a partir deste ambiente: descartado — é configuração de conta/permissão do dono do repo (`Settings → Branches`), não algo que roda em CI ou que eu tenha credencial pra fazer. Documentado como pendência manual em `docs/DONE-CRITERIA.md`.

### Consequência
`docs/DONE-CRITERIA.md` é a única fonte válida da nota daqui pra frente — qualquer alegação de SWOT/rating em README ou post deve apontar pra lá. 4 dos 6 grupos de critério seguem `[ ]`; subir a nota exige fechar adaptadores reais, rodar o CI verde no GitHub de fato, e configurar branch protection — nenhum dos três acontece dentro deste ambiente sandbox.

---

**scoobiii/vortex** · GOS3
