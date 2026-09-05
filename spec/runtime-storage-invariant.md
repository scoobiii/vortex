# Runtime Storage Invariant — v0.1

Status: **Normative**

Scope: applies to every Vortex runtime, regardless of host (Termux, proot-distro, Cloud Shell, Cloud Run, VM, CI runner, local workstation or other sandbox).

## Core rule

> **O filesystem local do runtime é scratch space.**

O runtime pode usar armazenamento local para trabalho temporário, cache, build e staging. Ele **não é uma fonte autoritativa de estado durável**.

Nenhuma execução Vortex pode depender exclusivamente do filesystem local para preservar:

- execution receipts;
- proof/evidence;
- attestations;
- histórico autoritativo de execução;
- artefatos canônicos;
- registros de publicação;
- qualquer estado cuja perda torne uma execução não verificável.

## Durable storage

Qualquer artefato que precise sobreviver ao ciclo de vida do runtime **MUST** ser persistido em um backend durável definido pelo deployment.

Exemplos de backends possíveis incluem repositório Git, object storage, banco de dados ou outro serviço de persistência com política explícita de retenção e verificação. A escolha do backend é uma decisão de deployment; o protocolo Vortex não deve assumir Termux, Cloud Shell ou outro filesystem local como storage durável.

A evidência deve permanecer verificável mesmo que o processo, container, VM ou dispositivo que executou a tarefa seja destruído imediatamente após a execução.

## Fail-closed publication

Se a persistência durável exigida para uma publicação não estiver disponível, a publicação **MUST** falhar fechado.

Em particular:

```text
execution
   ↓
receipt
   ↓
durable persistence
   ↓
verification
   ↓
publication
```

Não é permitido:

```text
execution
   ↓
/tmp/result.json
   ↓
"PASS"
   ↓
publication
```

Um arquivo local pode ser uma cópia de trabalho ou cache, mas sua existência isolada não constitui prova de persistência durável.

## Runtime exhaustion

Exaustão, indisponibilidade ou corrupção do filesystem local **MUST NOT** produzir uma publicação aparentemente bem-sucedida.

Quando o runtime não consegue produzir ou persistir a evidência exigida, o resultado deve ser explicitamente não-publicável, por exemplo:

```json
{
  "claim": "failed",
  "publication": "blocked",
  "reason": "durable_evidence_unavailable"
}
```

O sistema não deve converter erro de armazenamento em sucesso, nem tratar `stdout`, logs locais ou uma mensagem do shell como substituto da evidência durável.

## Separation of concerns

```text
HOST / RUNTIME
  Termux / Alpine / Cloud Shell / Cloud Run / VM / CI
          │
          │ executa
          ▼
     VORTEX CORE
          │
          ├── deterministic decision
          ├── execution receipt
          ├── evidence digest
          └── verification
          │
          ▼
   DURABLE STORAGE
          │
          ├── Git
          ├── Object Storage
          ├── Database
          └── outro backend aprovado
```

O host executa. O Vortex produz e verifica a evidência. O backend durável preserva o estado que precisa sobreviver ao runtime.

## Capacity invariant

A capacidade do filesystem local **MUST NOT** ser tratada como capacidade de armazenamento do Vortex.

Um ambiente com 5 GB, por exemplo, pode ser perfeitamente válido como runtime para uma tarefa pequena e inadequado como destino de artefatos persistentes. O Vortex deve separar essas duas decisões:

```text
compute capacity ≠ durable storage capacity
```

## Acceptance criteria

Uma implementação compatível deve demonstrar, por teste ou integração verificável, que:

1. artefatos temporários podem ser criados localmente;
2. a perda do filesystem local após a execução não elimina a evidência necessária;
3. uma execução sem persistência durável não pode ser publicada como sucesso;
4. uma publicação exige referência à evidência persistida;
5. cache, `/tmp`, workspace e logs locais não são tratados como fonte autoritativa;
6. o comportamento é igual em Termux, proot-distro, Cloud Shell, Cloud Run, VM e CI;
7. falha de persistência resulta em `publication=blocked` ou equivalente fail-closed.

## Relationship with GOS3

Este contrato complementa o modelo GOS3 de execução verificável:

```text
Agent / Proposer
      ↓
Admission
      ↓
Execution
      ↓
Proof Receipt
      ↓
Durable Persistence
      ↓
Verification
      ↓
Publication
```

**No durable evidence → no publication.**

---

**scoobiii/vortex** · Runtime Storage Invariant v0.1
