> **GOS3** · agente: `GPT` · papel: `Maintainer / Engineering Agent`
> fase: `Runtime Federation → Bounded Agent Loop` · data: `2026-08-26`
> antes: contrato v0.2 + máquina bounded ainda sem ponte operacional completa
> depois: sandbox restrito + verificação + rollback + PR/help providers + worker Qwen 0.5B adapter implementados; E2E real do Qwen depende de endpoint/modelo local disponível
> base: commit `57870c1`
> assinatura: `GPT · Maintainer / Engineering Agent · GOS3`

# BACKLOG — Vortex / GOS3

## Fase atual
Runtime Federation → Bounded Agent Loop

## Sprint 1 — Runtime Reference (Grok)
- [x] Adaptador Grok
- [x] Contrato mínimo de invocação
- [x] `executed` obrigatório
- [x] Evidência de execução
- [x] Testes históricos 19/19

## Sprint 2 — Generalização
- [x] Infra mínima TypeScript
- [x] Gate `executed:false` + `success` inválido
- [x] Gate anti-forgery de `evidence_hash`
- [x] Evidência real modelada no adapter GPT (`runtime_id`/`execution_id`)
- [ ] Extrair template comum dos adapters
- [ ] Finalizar onboarding dos agentes restantes

## Sprint 3 — Runtime Federation / Provenance
- [ ] PO approval da arquitetura de federation
- [ ] GOS3/xAI review
- [ ] Capability discovery com `runtime_id`
- [ ] Perfis A23/Termux, VPS, GCloud, Colab
- [ ] Endpoint `/invoke` real por adapter/runtime
- [x] Contrato v0.2 com limites do loop
- [x] Máquina de estados bounded em `src/gos3/runtime-loop.ts`
- [x] Executor sandbox restrito (`BubblewrapSandbox`) ligado ao loop
- [x] Verificação pós-worker pode promover PASS ou REGRESSION
- [x] Rollback real ao último commit bom via `git reset --hard`
- [x] Criação de PR somente após `PR_READY`
- [x] `HELP_REQUIRED` publica Issue estruturada somente após bloqueio/limite
- [x] Testes determinísticos de attempt-limit e rollback recovery
- [ ] Teste com sandbox gVisor real
- [ ] Auditoria de concorrência do persistence backend zAI/xAI

## Sprint 4 — Worker pequeno / Sandbox
- [x] Adapter Qwen Coder ~0,5B como worker bounded (OpenAI-compatible local endpoint)
- [x] Sandbox restrito com filesystem/exec controlados
- [x] Loop observe → execute → verify → evidence
- [x] Orçamento hard de tentativas e tempo
- [x] Detecção de progresso e repetição de erro
- [x] PR automático apenas em `PR_READY`
- [x] Issue de socorro automática em `HELP_REQUIRED`
- [ ] E2E real com Qwen ~0,5B local
- [ ] Benchmark reproduzível: tarefa útil pequena + regressão deliberada + recuperação

## Gate de conformidade

A arquitetura-alvo está estimada em **80–90% de alinhamento conceitual**, não 80–90% de implementação. O percentual não substitui testes nem aprovação.

Para declarar runtime operacional, exigir evidência de:
1. execução real no sandbox/runtime;
2. teste verificável;
3. `evidence_hash` válido;
4. limite de loop respeitado;
5. `PR_READY` somente após PASS;
6. `HELP_REQUIRED` após estagnação/bloqueio/limite;
7. rollback verificável em regressão;
8. E2E real do worker escolhido.

## Governance
- [ ] Não criar um segundo GOS3 no xAI; reutilizar o GOS3 do Vortex
- [ ] Permitir N agentes no board sem hardcode de sete
- [ ] Mudança relevante: `dor → issue → teste → execução → evidência → revisão → aprovação → commit/PR → backlog`
- [ ] Mudança de contrato/segurança: aprovação PO antes de merge

## Referências
- `spec/invocation-contract.md`
- `spec/gos3-system-instruction.md`
- `src/gos3/runtime-loop.ts`
- `src/gos3/orchestrator.ts`
- `src/agents/qwen05b/adapter/index.ts`
- `docs/runtime-execution-model.md`
- `docs/runtime-federation.md`
- `docs/gos3-provenance.md`
- `docs/decisions.md`
- `docs/DONE-CRITERIA.md`
