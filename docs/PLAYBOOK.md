# PLAYBOOK — Vortex / GOS3

Convenções de processo para o time NxN (qualquer agente/humano que operar neste ecossistema).

## 1. Governança de Mudanças em Contrato & Segurança

Qualquer alteração em `specs/invocation-contract.md`, em drafts futuros de contrato ou em mecanismos de isolamento de execução/sandbox **nunca é merge automático**. Decisões de contrato e segurança passam pelo PO-humano antes de virarem implementação.

## 2. Cabeçalho GOS3 Obrigatório

Todo arquivo criado ou editado por um agente do GOS3 deve conter o cabeçalho no topo:

```markdown
> **GOS3** · agente: `<nome>` · papel: `<papel>` (ver docs/team.md)
> fase: `<fase do backlog>` · data: `<AAAA-MM-DD>` · hora: `<HH:MM:SS TZ>`
> antes: <estado de 1 linha antes desta mudança>
> depois: <o que esta mudança entrega/altera>
> base: commit `<hash>` (se aplicável)
> assinatura: `<nome do agente> · <papel> · GOS3`
```

## 3. Protocolo de Prova de Execução (Zero-Trust)

- Se executou: capturar `exit_code`, `stdout_raw`, `duration_ms` e gerar `output_hash` (SHA-256).
- Se não executou ou falhou: retornar `claim: "not_executed"` ou `claim: "failed"` de forma explícita.
- **Proibição Absoluta de Fallbacks Simulados**: É estritamente proibido simular respostas de APIs ausentes com geradores locais de texto disfarçados de provedores remotos.
