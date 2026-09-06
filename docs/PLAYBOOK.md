# PLAYBOOK — Vortex / GOS3

Convenções de processo para o time NxN (qualquer agente/humano que operar neste ecossistema).

## 0. Regra institucional — Mexeu → Testa → Valida → Publica

Esta regra é obrigatória para qualquer mudança que possa afetar CI, branch protection, runtime, contrato, segurança ou capacidade de publicação.

```text
LEITURA
  ↓
IMPACTO NO CI / PROTEÇÃO
  ↓
PROPOSTA / DIFF MÍNIMO
  ↓
ESCRITA
  ↓
TESTE LOCAL
  ↓
PR + CI ONLINE
  ↓
VALIDAÇÃO DO CHECK OBRIGATÓRIO
  ↓
PUBLICAÇÃO / MERGE
  ↓
VERIFICAÇÃO DO ESTADO FINAL
```

### Regras de bloqueio

1. **Nunca adicionar ou alterar um check obrigatório sem validar antes o workflow que o produz.**
2. **Nunca presumir que um workflow novo será reconhecido como check obrigatório no PR.** Se a proteção exige um check, o workflow que produz esse check deve existir na base apropriada antes de depender dele.
3. **Toda mudança em workflow deve passar pelo CI online antes do merge.**
4. **Todo check exigido pela proteção de `main` deve terminar `success` no PR antes do merge.**
5. **Falha de CI é bloqueio, não algo a ser contornado.** Corrige-se a causa e executa-se novamente.
6. **Depois do merge, verificar o estado do CI no `main` quando a mudança afeta CI/proteção.**
7. Se não for possível observar um resultado, o estado é **não verificado**, nunca `PASS`.

### Critério de verdade

```text
PROMETIDO   ≠   PROPOSTO   ≠   IMPLEMENTADO   ≠   EXECUTADO   ≠   VALIDADO
```

Um arquivo alterado não prova que o comportamento está funcionando. A prova mínima para uma mudança de CI é:

- diff identificado;
- teste/checagem executado;
- execução do GitHub Actions observada;
- check relevante em `success`;
- estado final do branch/PR verificado.

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
