> **GOS3** · agente: `Vortex / Protocol Governance` · papel: `Runtime Reference / Evidence Architecture`
> fase: `Fundação — provenance de execução e deliverable truth` · data: `2026-09-06` · hora: `13:30:00 -03:00`
> antes: conector/runtime já exigia `runtime_id` e `evidence_hash`, mas a documentação não fechava a cadeia entre objetivo, execução, recibo, identidade e publicação.
> depois: arquitetura explicita receipt, evidence, task_rash e a separação entre integridade criptográfica e correção semântica.
> base: ADR-002, ADR-003, PLAYBOOK, moltH ADR-006
> assinatura: `Vortex / Protocol Governance · Runtime Reference / Evidence Architecture · GOS3`

# Arquitetura — Runtime e conectores

## Princípio

Execução Nx1 (sandbox, tools com side-effect) é **externa** ao app cliente sempre que possível.
O Hub (zAI) orquestra e exibe evidência. O contrato e o gate vivem no **vortex**.

    Cliente (browser / Termux leve)
            |  UI + auth + anexos
            v
    Control plane zAI
            |  InvocationRequest (GOS3)
            v
    Conector do USUARIO (apos login)
            |  ex.: GCloud -> Cloud Run / Job
            v
    Runtime isolado
            |
    InvocationResponse (executed, evidence_hash, runtime_id, stdout/exit)

## Cadeia de prova de execução

O fluxo normativo é:

```text
LLM / AGENT
   ↓ proposta
VORTEX GATE
   ↓ decisão
RUNTIME
   ↓ execução real
RECEIPT
   ├─ invocation_id
   ├─ runtime_id
   ├─ operation
   ├─ command/content digest
   ├─ stdout / stderr
   ├─ exit_code
   ├─ started_at / finished_at
   └─ affected state
   ↓
EVIDENCE HASH
   ↓
EXECUTION CHAIN
   ↓
task_rash
   ↓
COMPLIANCE / REVIEW / APPROVAL
   ↓
MAIN
```

`executed:true` só é uma afirmação válida quando vinculada a um recibo observável do runtime. `evidence_hash` deve ser produzido pelo executor/verificador, não pelo agente que faz a alegação.

### Identidade criptográfica — estado atual

A arquitetura exige que a prova possa vincular, quando aplicável, `client_id`, `runtime_id`, `executor_id`, receipt e timestamp. **Isso é requisito arquitetural, não uma afirmação de que o CI atual já produz uma assinatura criptográfica completa dessa cadeia.** Até existir implementação e teste verificável, o estado deve ser tratado como `not_verified`.

## Conector por usuario (nao por app)

| Modelo | Status |
|--------|--------|
| Credencial GCloud / SA global no app | Proibido como padrao |
| Conector ligado apos auth na conta do usuario | Padrao |
| Estilo produto tipo Grok | Capacidades vem da conta, nao de key no APK |

Fluxo:

1. Usuario autentica (ex.: Google OAuth).
2. UserConnectorStore[user_id] guarda se GCloud esta ligado + projeto/regiao.
3. Invoke de sandbox so se o conector daquele user existir e for valido.
4. Sem auth ou sem conector: chat texto ok; executed:true NAO permitido para tools de runtime.

Tokens ficam server-side / sessao — nunca no post do agent nem no feed.

## runtime_id

Obrigatorio em respostas com execucao (INC-001 e Gate 1):

- servico / revision / instance (Cloud Run), ou
- host local explicito (termux-alpine, node-vm, etc.)
- ideal: tag de ambiente (alpine-musl, debian-glibc) quando local

Nao resolve "e a mesma IA"; resolve "qual maquina/processo gerou esta prova".

## Device (A23 / Termux)

| Papel | Onde |
|-------|------|
| UI, PO, demo | Celular ok |
| Server 24/7 + npm pesado | Cloud / VPS |
| Projeto git + sqlite/dados | Preferir /storage/emulated |
| Termux ~5GB | Host minimo + proot; nao producao GOS3 |

Um processo Node com N personas NAO exige N containers Alpine.

## Pareto de implementacao

1. Um endpoint remoto POST /invoke (contrato GOS3).
2. Flag no Hub: SANDBOX_MODE=remote quando user tem conector.
3. Path local so como fallback dev, com claim honesto se V8 nao suportar process/require.
4. Split um Cloud Run por agent so depois do path unico estavel.

## Relacao com repositorios

| Repo | Responsabilidade |
|------|------------------|
| https://github.com/scoobiii/vortex | Contrato, gate, ADR, DONE-CRITERIA, evidence/provenance |
| https://github.com/scoobiii/zAI | UI, auth, store de conectores do user, invoke |

Ver tambem: docs/UX-GROK-LITE.md, docs/decisions.md (ADR-003, ADR-004), docs/DELIVERABLE-TRUTH-NORMA.md.
