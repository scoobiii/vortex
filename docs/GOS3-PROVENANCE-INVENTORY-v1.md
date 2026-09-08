# GOS3 Provenance Inventory v1

## GOS3

- arquivo: `docs/GOS3-PROVENANCE-INVENTORY-v1.md`
- responsabilidade: inventário canônico de proveniência dos arquivos GOS3 validados na `main`
- agente: GPT
- papel: Maintainer / Engineering Agent
- fase: Provenance → Artifact Inventory
- data: 2026-09-08
- hora: 15:23
- antes: os cabeçalhos GOS3 estavam distribuídos nos artefatos, sem inventário consolidado que separasse identidade Git de hash criptográfico do conteúdo.
- depois: inventário versionado de 10 arquivos reais da `main`, com campos de cabeçalho preservados e distinção explícita entre Git blob SHA e SHA-256 do conteúdo quando calculável.
- base: `main`
- assinatura: agent/llm · Engineering Agent · GOS3
- commit: registered by Git

## Objetivo

Este documento registra a proveniência observada de 10 arquivos reais da `main` que possuem cabeçalho GOS3. O inventário não substitui os cabeçalhos dos arquivos e não transforma existência de código em evidência de execução.

## Regra de identidade

Dois identificadores são mantidos separados:

- **Git blob SHA**: identificador do objeto de conteúdo usado pelo GitHub para o arquivo.
- **SHA-256 do conteúdo**: digest criptográfico SHA-256 dos bytes do arquivo. Não deve ser inferido a partir do Git blob SHA.

Quando o SHA-256 do conteúdo ainda não foi calculado diretamente a partir dos bytes, o campo permanece `NOT_CALCULATED`; nenhum valor é inventado.

## Fonte de verdade

Base verificada: `main` do repositório `scoobiii/vortex`.

Commit-base observado no tree da `main`: `3d39ecc2242367d0b0089fdbc5a6a5fba8432e44`.

## Inventário

| # | Arquivo | Data | Hora | Fase | Git blob SHA | SHA-256 conteúdo |
|---:|---|---|---|---|---|---|
| 1 | `README.md` | 2026-09-07 | 00:00 | Technical Refinement → Runtime Federation | `e741c8add052de88940787187ae884530df052c1` | `NOT_CALCULATED` |
| 2 | `.github/workflows/gos3-compliance.yml` | 2026-09-07 | 18:09 | implementation | `a28c4117eaab6742bbfdf2dd000f12baccb4adb4` | `NOT_CALCULATED` |
| 3 | `connectors/github/adapter/index.ts` | 2026-09-07 | 00:00 | Connector Federation → GitHub Adapter | `7ec616f6783c1e6d562a7a0295b7b7215e0f3028` | `NOT_CALCULATED` |
| 4 | `connectors/github/mcp/index.ts` | 2026-09-07 | 00:00 | Connector Federation → GitHub MCP | `c8b377ab4ec7a48762eee2062aae216f72f2edc1` | `NOT_CALCULATED` |
| 5 | `connectors/github/index.ts` | 2026-09-07 | 00:00 | Connector Federation → GitHub Connector | `936fc321b6711e78c0132991ef16d88b1bbd2102` | `NOT_CALCULATED` |
| 6 | `connectors/github/tests/connector.test.ts` | 2026-09-07 | 00:00 | Connector Federation → GitHub Contract Test | `c500a3e9246948b0566d00c3aba082940d91fbc8` | `NOT_CALCULATED` |
| 7 | `connectors/ollama/adapter/index.ts` | 2026-09-07 | 00:00 | Runtime Federation → Ollama Connector | `6399d7292dde150d02cf83c91c7d83cb8dd99ac9` | `NOT_CALCULATED` |
| 8 | `connectors/ollama/provenance/index.ts` | 2026-09-07 | 00:00 | Runtime Federation → Ollama Provenance | `ba2c8f568717113736befb49491bd1ea8b943558` | `NOT_CALCULATED` |
| 9 | `connectors/ollama/index.ts` | 2026-09-07 | 00:00 | Runtime Federation → Ollama Connector | `52f9d9f71c0be2d101f64323a53ac760668b0332` | `NOT_CALCULATED` |
| 10 | `connectors/ollama/tests/connector.test.ts` | 2026-09-07 | 00:00 | Runtime Federation → Ollama Connector Test | `da8e3f64059340cb8de37a19e539965f389247bf` | `NOT_CALCULATED` |

## Header fields observed

### 1. `README.md`

```text
## GOS3 Maintainer / Engineering Agent
## fase: Technical Refinement → Runtime Federation · data: 2026-09-07 · hora: 00:00
## antes: README refinado sem header GOS3, causando falha do gate check-headers no PR #51.
## depois: header GOS3 obrigatório adicionado sem alterar o conteúdo refinado do README.
## base: main
## assinatura: GOS3 Maintainer / Engineering Agent · GOS3
## commit: registered by Git
```

### 2. `.github/workflows/gos3-compliance.yml`

```text
# GOS3
# arquivo: .github/workflows/gos3-compliance.yml
# responsabilidade: gates de governança, contratos, onboarding e E2E do Vortex
# agente: agent/llm
# papel: Engineering Agent
# fase: implementation
# data: 2026-09-07
# hora: 18:09
# antes: sha256:e2a4eff7180944edb7d591200c664ce4e4d01076
# depois: sha256:pending
# base: commit:1a4f271425f6ce8ebbad8c8aae0bd75a59a9c787
# assinatura: P0 scoobiii : Agente GPT
# commit: pending
```

### 3. `connectors/github/adapter/index.ts`

```text
// GOS3
// agente: GPT
// papel: Maintainer / Engineering Agent
// fase: Connector Federation → GitHub Adapter
// data: 2026-09-07
// hora: 00:00
// antes: GitHub capability existed without a repository-local connector boundary
// depois: explicit GitHub connector contract over existing gateway concepts
// base: src/gateway connector/proof contract
// assinatura: agent/llm · Engineering Agent · GOS3
// commit: registered by Git
```

### 4. `connectors/github/mcp/index.ts`

```text
// GOS3
// agente: GPT
// papel: Maintainer / Engineering Agent
// fase: Connector Federation → GitHub MCP
// data: 2026-09-07
// hora: 00:00
// antes: MCP boundary was documentation only
// depois: executable MCP-facing operation descriptor
// base: GitHub connector request contract
// assinatura: agent/llm · Engineering Agent · GOS3
// commit: registered by Git
```

### 5. `connectors/github/index.ts`

```text
// GOS3
// agente: GPT
// papel: Maintainer / Engineering Agent
// fase: Connector Federation → GitHub Connector
// data: 2026-09-07
// hora: 00:00
// antes: no connector package entry point
// depois: stable GitHub connector contract export
// base: gateway connector contract
// assinatura: agent/llm · Engineering Agent · GOS3
// commit: registered by Git
```

### 6. `connectors/github/tests/connector.test.ts`

```text
// GOS3
// agente: GPT
// papel: Maintainer / Engineering Agent
// fase: Connector Federation → GitHub Contract Test
// data: 2026-09-07
// hora: 00:00
// antes: no repository-local GitHub connector contract
// depois: request/proof contract is executable
// base: gateway InvokeRequest/ExecutionProof
// assinatura: agent/llm · Engineering Agent · GOS3
// commit: registered by Git
```

### 7. `connectors/ollama/adapter/index.ts`

```text
// GOS3
// agente: GPT
// papel: Maintainer / Engineering Agent
// fase: Runtime Federation → Ollama Connector
// data: 2026-09-07
// hora: 00:00
// antes: Ollama runtime lived implicitly behind the Qwen adapter
// depois: explicit connector boundary while preserving Qwen runtime behavior
// base: existing Qwen OpenAI-compatible adapter
// assinatura: agent/llm · Engineering Agent · GOS3
// commit: registered by Git
```

### 8. `connectors/ollama/provenance/index.ts`

```text
// GOS3
// agente: GPT
// papel: Maintainer / Engineering Agent
// fase: Runtime Federation → Ollama Provenance
// data: 2026-09-07
// hora: 00:00
// antes: provenance implementation coupled to Qwen adapter
// depois: reusable Ollama provenance exports
// base: existing Qwen SHA-256 provenance implementation
// assinatura: agent/llm · Engineering Agent · GOS3
// commit: registered by Git
```

### 9. `connectors/ollama/index.ts`

```text
// GOS3
// agente: GPT
// papel: Maintainer / Engineering Agent
// fase: Runtime Federation → Ollama Connector
// data: 2026-09-07
// hora: 00:00
// antes: no connector package entry point
// depois: stable Ollama connector export
// base: existing Qwen adapter
// assinatura: agent/llm · Engineering Agent · GOS3
// commit: registered by Git
```

### 10. `connectors/ollama/tests/connector.test.ts`

```text
// GOS3
// agente: GPT
// papel: Maintainer / Engineering Agent
// fase: Runtime Federation → Ollama Connector Test
// data: 2026-09-07
// hora: 00:00
// antes: no explicit Ollama connector contract test
// depois: connector delegates to the known working Qwen/Ollama path
// base: Qwen contract test
// assinatura: agent/llm · Engineering Agent · GOS3
// commit: registered by Git
```

## Verificações

- `10/10` arquivos são arquivos reais da `main`.
- `10/10` possuem `GOS3` no cabeçalho observado.
- `10/10` possuem data declarada no cabeçalho.
- `9/10` possuem hora declarada no cabeçalho; o README também declara hora na linha composta.
- Os valores `sha256:pending` e `commit: pending` presentes no workflow são preservados como estado real do cabeçalho e não substituídos pelo Git blob SHA.
- O Git blob SHA é registrado separadamente do hash criptográfico de conteúdo.
- Nenhum SHA-256 de conteúdo é inventado.

## Verificador reproduzível

O repositório agora contém `scripts/verify-gos3-provenance.mjs`, que lê os bytes locais dos mesmos 10 arquivos, calcula SHA-256 com `node:crypto` e falha se algum arquivo não contiver o marcador `GOS3`.

Executar após `npm ci`:

```bash
npm run verify:gos3:provenance
```

A saída produz uma linha por arquivo no formato:

```text
arquivo\tsha256:<digest>
```

Esse comando é deliberadamente **calculador/verificador**, e não preenche o inventário com valores que não tenham sido produzidos por execução real do comando sobre os bytes do checkout. Assim, o estado `NOT_CALCULATED` permanece correto até que essa execução seja registrada como evidência.

## Relação com evidência de execução

Este inventário é **proveniência de artefato**, não `ExecutionEvidence`.

```text
GOS3 HEADER
    ↓
ARTIFACT IDENTITY
    ↓
GIT BLOB SHA
    ↓
CONTENT SHA-256 (quando calculado)
    ↓
EXECUTION EVIDENCE
    ↓
BENCHMARK / BASELINE
```

A presença do inventário não implica que os arquivos foram executados. Execução e benchmark continuam dependendo de evidência real produzida pelo runtime/CI.

## Critério de atualização

O inventário deve ser atualizado quando:

1. um arquivo GOS3 inventariado mudar;
2. um novo artefato passar a fazer parte do conjunto normativo;
3. o SHA-256 do conteúdo for calculado diretamente dos bytes do arquivo;
4. houver alteração de contrato de proveniência.

Toda atualização deve preservar a distinção entre:

```text
Git identity ≠ content digest ≠ execution proof ≠ benchmark evidence
```
