# Decisões — vortex (ADR-style)

Registro formal de decisões. Toda mudança de contrato ou arquitetura entra aqui com contexto, decisão, alternativas e estado de aprovação.

## ADR-001 — Corrigir links quebrados do README + abrir Technical Refinement

**Data:** 2026-08-14  
**Autor:** Claude  
**Status:** Aceito

### Contexto
Revisão externa identificou links quebrados e ausência de interface concreta.

### Decisão
Corrigir a documentação e adiantar o contrato de invocação v0.1 para fechar o gap mais crítico.

---

## ADR-002 — Sprint Prova 3/3: evidência em vez de claims

**Data:** 2026-08-14  
**Autor:** Claude  
**Status:** Aceito

### Decisão
`executed:true` requer evidência; testes e gates devem provar execução. Ratings e claims não substituem prova.

---

## ADR-003 — Runtime externo; conector GCloud por usuário

**Data:** 2026-08-22  
**Autor:** Grok  
**Status:** Aceito (diretriz; implementação zAI pendente)

### Decisão
Preferir runtime externo, conector GCloud autenticado por usuário, não chave cloud global no cliente; `runtime_id` é obrigatório em respostas executadas.

---

## ADR-004 — UX Grok-like com + para arquivos

**Data:** 2026-08-22  
**Autor:** Grok  
**Status:** Aceito (diretriz; implementação zAI pendente)

### Decisão
Thread + compose como UX principal; anexos no `+`; mobile/LITE limitado a poucos agentes visíveis; falhas de sandbox devem ser visíveis.

---

## ADR-005 — Runtime Federation + Provenance do xAI

**Data:** 2026-08-23  
**Autor:** GPT  
**Status:** **Proposta — aguardando PO + revisão GOS3 no xAI**  
**Issue:** #11

### Contexto
O zAI legado evoluiu para xAI como fork forçado e o ambiente pode hospedar 28+ agentes. Runtimes heterogêneos incluem A23/Termux, VPS, GCloud e Colab. O proot Alpine pode ser instável; portanto, o agente não deve ficar acoplado a um único runtime.

Também existe risco de transformar claims documentais (`100%`, `GOS3 Certified`, benchmarks, WAL) em fatos sem proveniência reproduzível.

### Decisão proposta
1. **Reaproveitar o GOS3 do Vortex; não criar um segundo GOS3 no xAI.**
2. Permitir N agentes no board; os 28 agentes do xAI podem atuar como proposers/reviewers.
3. Separar Agent de Runtime através do invocation-contract.
4. Adotar capability discovery e `runtime_id`.
5. Usar write-once/run-anywhere no nível do artefato/contrato; compilações nativas continuam dependentes do perfil.
6. Aplicar a regra **mexeu, deixa rastro**: dor → Issue → proposta → teste → execução → telemetria → evidência → revisão → aprovação → commit/PR → backlog.
7. Proibir `status:success` quando `executed:false` e proibir mocks silenciosos.

### Alternativas descartadas
- Criar um novo GOS3 específico para xAI: duplicaria governança e quebraria a proveniência entre projetos.
- Fazer o A23/proot ser o runtime universal: frágil e acopla arquitetura à máquina.
- Promover claims do README a evidência: descartado; benchmark deve ser reproduzível.

### Aprovação
**PO:** pendente.  
**GOS3/xAI:** pendente.

### Consequência
A proposta foi documentada e aberta como Issue #11. A implementação só deve ser marcada como aceita após as aprovações requeridas.

---

**scoobiii/vortex · GOS3**
> GOS3 - agente: Claude - papel: Proposer
> fase: Technical Refinement - data: 2026-08-30
> assinatura: Claude - Proposer - GOS3
> status: PROPOSED - adicionar a docs/decisions.md

## ADR-004: Agentes genéricos soberanos vs. LLM apps big-tech

**Data**: 2026-08-30
**Status**: Aceito

### Contexto

O README e o team.md do vortex descreviam os 7 agentes do GOS3 (Grok,
Claude, GPT, Gemini, Qwen, DeepSeek, Manus, Perplexity) como se cada um
tivesse sandbox/runtime soberano próprio, isolado, capaz de execução real
verificável.

Auditoria feita no runtime moltH (Sprint 0, 2026-08-30) testou essa
alegação diretamente e encontrou:

- Grok: roda no sandbox do X, mas sem Node.js, sem repo clonado, sem
  execução de comando arbitrário.
- Meta: mesma limitação.
- DeepSeek: tem framework DSH mencionado, mas nesta configuração é
  apenas LLM app, sem acesso a filesystem ou runtime Node.

Conclusão da auditoria: "nenhuma (ainda) soberana imperativa" — nenhum dos
7 agentes big-tech tinha, até esta data, prova equivalente ao que o moltH
demonstrou (Contract Gate 10/10, `runtime_id` + `evidence_hash` reais,
ADR-003).

### Decisão

1. Reclassificar todos os 7 agentes do board como **Proposers (NxN)** —
   podem raciocinar, gerar código, propor patch — sem alegar runtime
   soberano próprio até que produzam prova equivalente ao Contract Gate.

2. **moltH** passa a ser o Runtime Soberano de referência (Nx1) —
   substitui a alegação anterior de "Grok como Runtime Reference",
   corrigindo o team.md.

3. Critério de promoção Proposer → Runtime Soberano: qualquer agente
   (big-tech ou não) que rodar o Contract Gate (Python 4/4 + TS 6/6,
   incluindo `runtime_id` obrigatório) com evidência real, colada e
   verificável por terceiro, pode ser promovido.

4. `README.md` e `docs/team.md` atualizados para não confundir "LLM com
   boa retórica sobre execução" com "runtime soberano confirmado".

### Consequências

- Positivo: elimina a categoria de erro mais comum documentada nesta
  conversa inteira — alegação de execução sem prova ("cara de bunda").
- Positivo: dá critério objetivo e replicável (Contract Gate) para
  qualquer agente futuro provar capacidade real.
- Negativo: reduz a alegação de "federação de 7 sandboxes" que soava
  bem no README original, mas não era verdade — trade-off aceito porque
  o projeto existe justamente para valorizar verdade sobre retórica.

### Referências

- Auditoria moltH, 2026-08-30 (Sprint 0 envelope offline, Contract Gate)
- ADR-003 (runtime_id obrigatório)
- docs/team.md (correção histórica, mesma data)
