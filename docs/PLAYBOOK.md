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

**Enforcement:** a regra exige validação estrutural no topo do arquivo e dos sete campos; um `grep` por `GOS3` isoladamente não constitui conformidade.

## 3. Protocolo de Prova de Execução (Zero-Trust)

- Se executou: capturar `exit_code`, `stdout_raw`, `duration_ms` e gerar `output_hash` (SHA-256).
- Se não executou ou falhou: retornar `claim: "not_executed"` ou `claim: "failed"` de forma explícita.
- `executed:true` não pode ser derivado apenas de uma flag declarativa do agente; deve estar vinculado a recibo observável do runtime.
- **Proibição Absoluta de Fallbacks Simulados**: É estritamente proibido simular respostas de APIs ausentes com geradores locais de texto disfarçados de provedores remotos.

## 4. DELIVERABLE-TRUTH / R7

A norma canônica está em `docs/DELIVERABLE-TRUTH-NORMA.md`.

```text
OBJECTIVE → goal_hash → EXECUTION CHAIN → task_rash
→ R7 / CI → INDEPENDENT REVIEW → HUMAN APPROVAL → MAIN
```

`task_rash` prova a integridade da cadeia registrada; **não** prova correção semântica, qualidade ou valor. CI também não substitui revisão independente nem aprovação humana.

### Regra vinculante

Nenhum agente pode declarar `PASS`, `implemented`, `complete` ou `production-ready` quando o entregável estiver bloqueado por DELIVERABLE-TRUTH, mesmo que compilação e testes convencionais passem.

## 5. Domínios protegidos P0 / Zero Mock Escape

Mudanças de produção envolvendo `wallet`, `PIX`, `DREX`, `financial`, `banking`, `payment`, `settlement`, `balance`, `account`, `secret`, `credential`, `authentication`, `authorization` ou `security` entram no escopo P0 quando afetarem o fluxo/implementação real.

Mocks/fixtures/simulations são permitidos no escopo de teste, mas não como implementação de produção. Ausência de integração ou credencial deve resultar em estado explícito (`not_executed` / `auth_required`), nunca em sucesso simulado.

## 6. Ciclo de Incidente e Correção

Descobrir um mock ou erro **não autoriza apagá-lo silenciosamente para fazer o compilador passar**.

```text
INCIDENT → BLOCK / QUARANTINE → CORRECTION
→ INDEPENDENT REVIEW → CI → COMPLIANCE PASS
→ HUMAN APPROVAL → MAIN
```

Regra: **MEXEU → ACHOU ERRO → CONSERTA**.

## 7. Protocolo de Operações Sensíveis

Operações `CREATE`, `EDIT`, `DELETE`, `MOVE`, `RENAME`, `REPLACE`, `EXECUTE`, `PUBLISH` e `MERGE` devem ser avaliadas pelo gate apropriado. Operações destrutivas exigem análise de consumidores, imports, contratos e testes afetados; dependência não resolvida é bloqueio.

## 8. Governança de publicação

P0 exige, no mínimo, evidência de runtime, testes, compliance, revisão independente e aprovação humana antes de `main`. Nenhuma etapa pode ser inferida de outra.

Para a definição formal, consulte `docs/DELIVERABLE-TRUTH-NORMA.md`.
