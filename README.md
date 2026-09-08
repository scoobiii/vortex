## GOS3 Maintainer / Engineering Agent
## fase: Technical Refinement → Runtime Federation · data: 2026-09-07 · hora: 00:00
## antes: README refinado sem header GOS3, causando falha do gate check-headers no PR #51.
## depois: header GOS3 obrigatório adicionado sem alterar o conteúdo refinado do README.
## base: main
## assinatura: GOS3 Maintainer / Engineering Agent · GOS3
## commit: registered by Git

# Vortex

![USE VORTEX! - Python, LLMs, Sandbox & Runtime](docs/images/use-vortex-cover.png)

> **Proof over prose. HASH + TEMPO + LOG.**

**Vortex** é uma camada de contrato, execução e evidência para agentes LLM, runtimes e conectores. O projeto define como uma solicitação é representada, executada e registrada sem confundir **código existente**, **execução real** e **prova da execução**.

```text
AGENTE
  ↓
INVOCATION CONTRACT
  ↓
GATEWAY / RUNTIME / CONNECTOR
  ↓
EXECUÇÃO
  ↓
EVIDÊNCIA + PROVENANCE
```

## Entregáveis do projeto

O Vortex entrega uma **infraestrutura verificável de invocação** composta por contratos, runtime, gateway, conectores, governança, testes e evidências.

| Entregável | O que entrega | Estado |
|---|---|---|
| **Invocation Contract** | request/response, `invocation_id`, agente, ação, payload, contexto, resultado, erro, logs e duração | **Implementado + testado** |
| **GOS3 Governance** | headers, rastreabilidade, política de mudança e gates de CI | **Implementado** |
| **Runtime Loop** | ciclo controlado de invocação, execução, resultado e estado | **Implementado + testado** |
| **Orchestrator** | coordenação do fluxo de execução | **Implementado + testado** |
| **Gateway** | fronteira comum para requests, connectors e execution proofs | **Implementado + testado** |
| **Qwen 2.5 Coder 0.5B** | adapter funcional para runtime local via Ollama/OpenAI-compatible API | **Implementado + E2E real em CI** |
| **Ollama Connector** | integração com runtime local | **Implementado + contract test** |
| **GitHub Connector** | fronteira MCP → Gateway para operações GitHub | **Implementado + contract test** |
| **Grok Adapter** | adapter de referência e fixtures de contrato | **Implementado + testado** |
| **VUA** | adapter universal experimental | **P&D / experimental** |
| **Provenance** | identidade, hashes, runtime/modelo e artefatos de evidência | **Implementado em fluxos específicos** |
| **CI/CD** | gates de contrato, governança, truth matrix e E2E Qwen | **Implementado** |

> **VUA é P&D. O runtime funcional do Qwen não depende de VUA.**

---

# Entregáveis por público

## 1. Usuário — uso e resultado

O usuário precisa saber **o que pode pedir, o que foi executado e qual evidência existe**.

O Vortex entrega:

- solicitação padronizada de execução;
- identificação da invocação e do agente;
- runtime/conector utilizado quando disponível;
- resultado, erro, logs e duração;
- distinção entre `dry_run` e execução;
- evidência nos fluxos que suportam provenance;
- hashes e artefatos para auditoria quando disponíveis;
- rejeição explícita quando não há capacidade compatível;
- rastreabilidade da mudança e do artefato utilizado.

**Limite:** `executed: true` não é prova universal de side-effect externo. Prova forte de efeito externo continua sendo evolução do projeto.

## 2. DevOps / SRE — operação e confiabilidade

O Vortex entrega uma **superfície operacional observável e controlável** para agentes, runtimes e conectores.

Entregáveis:

- contratos versionados de invocação;
- timeout e contexto de execução;
- identificação de runtime e execução;
- stdout/stderr e exit code nos fluxos aplicáveis;
- duração da execução;
- hashes de evidência;
- provenance de modelo/runtime quando aplicável;
- Gateway como fronteira entre agente, credencial e serviço externo;
- conectores isolados por capacidade;
- contract tests;
- CI com gates obrigatórios;
- E2E real do Qwen em CI;
- branch protection e revisão por PR;
- artefatos de CI para auditoria e troubleshooting.

### Critério de DONE

```text
IMPLEMENTADO
+
TESTE EXECUTÁVEL
+
CI PASS
+
INTEGRAÇÃO REAL
+
EVIDÊNCIA
+
HASH / PROVENIÊNCIA
=
DONE
```

Sem todas as evidências aplicáveis, o claim permanece **PARTIAL**, **NOT PROVEN** ou equivalente.

## 3. Agentes LLM — invocação e autoridade

O Vortex fornece uma **superfície de invocação previsível**, com fronteiras explícitas de capacidade e autoridade.

Entregáveis:

- Invocation Contract único;
- `invocation_id` para rastreabilidade;
- identificação do agente;
- `action` e `payload` estruturados;
- sandbox, timeout e `dry_run`;
- resposta e erro estruturados;
- logs e duração;
- Gateway para ferramentas e conectores;
- separação entre credencial e agente;
- provenance para distinguir afirmação de execução observada;
- documentação de capacidades e limites;
- contract tests para integrações.

### Regra para agentes

```text
DOCUMENTADO
   ≠
IMPLEMENTADO
   ≠
EXECUTADO
   ≠
VERIFICADO
```

O agente não deve declarar uma tarefa concluída além do nível de evidência disponível.

---

# Modelo de verdade

- **PROMISED** — proposto ou planejado.
- **IMPLEMENTED** — existe código/configuração correspondente.
- **EXECUTED** — houve execução observada.
- **VERIFIED** — existe evidência suficiente, reproduzível e auditável para o claim específico.

```text
PROMISED → IMPLEMENTED → EXECUTED → VERIFIED
```

A matriz canônica de claims está em [`docs/PRODUCT-TRUTH.md`](docs/PRODUCT-TRUTH.md).

---

# Arquitetura atual

```text
                         AGENT
                           │
                           ▼
                 INVOCATION CONTRACT
                           │
                           ▼
                      ORCHESTRATOR
                           │
                           ▼
                       GATEWAY
                    ┌──────┼──────┐
                    │      │      │
                    ▼      ▼      ▼
                  QWEN   OLLAMA  GITHUB
                    │      │      │
                    ▼      ▼      ▼
                 RUNTIME CONNECTOR / MCP
                    │      │      │
                    └──────┼──────┘
                           ▼
                       EXECUTION
                           │
                           ▼
                 RESULT / LOG / PROVENANCE
                           │
                           ▼
                        EVIDENCE
```

| Área | Responsabilidade |
|---|---|
| `src/agents/` | adapters e contratos específicos |
| `src/gateway/` | fronteira de invocação, connector e execution proof |
| `src/vortex/vua/` | adapter universal experimental (P&D) |
| `connectors/ollama/` | integração com runtime local |
| `connectors/github/` | integração MCP com GitHub através do Gateway |
| `spec/` / `specs/` | contratos e regras de interface |
| `docs/` | governança, truth, decisões, provenance e operação |
| `.github/workflows/` | gates de CI e E2E |

---

# Qwen 0.5B — runtime funcional

O Qwen 2.5 Coder 0.5B é o fluxo de execução local real atualmente coberto por E2E.

```text
Vortex → Qwen Adapter → Ollama → qwen2.5-coder:0.5b
                                  ↓
                         resposta real
                                  ↓
                       provenance + evidence hash
```

O E2E captura e exige proveniência operacional mínima:

- modelo e digest;
- versão reportada pelo runtime;
- hash do binário/runtime;
- execution id;
- invocation id;
- stdout/stderr;
- exit code;
- duração;
- hash da evidência.

### E2E real convencional

```bash
npm ci
npm run test:qwen05b:contract
npm run test:qwen05b:e2e
```

O E2E exige Ollama funcional, o modelo `qwen2.5-coder:0.5b` e `QWEN_MODEL_DIGEST`, `QWEN_RUNTIME_DIGEST` e `QWEN_RUNTIME_VERSION`. Mock não classifica esse fluxo como execução real.

### E2E real com GOS3 sandbox

O sandbox executa o onboarding **antes** da alteração e só aceita a mudança quando o Qwen executou com proveniência completa.

```bash
npm run test:qwen05b:sandbox:e2e
```

O fluxo verifica:

- GOS3 onboarding antes da alteração;
- fase inicial `onboard`;
- `executed=true` e `exit_code=0`;
- `invocation_id` e `execution_id`;
- modelo e digest;
- versão reportada pelo runtime;
- hash do runtime/binário;
- hash SHA-256 do corpo antes/depois;
- cabeçalho GOS3 preservado;
- preflight do artefato final;
- `evidence_hash` de 64 hex caracteres;
- artefato `qwen-sandbox-evidence.json`.

A ausência de qualquer uma das três variáveis de proveniência (`QWEN_MODEL_DIGEST`, `QWEN_RUNTIME_DIGEST`, `QWEN_RUNTIME_VERSION`) faz o E2E falhar explicitamente.

### Proveniência local

Os valores devem vir do runtime efetivamente executado; não devem ser inventados nem substituídos silenciosamente por valores de outro ambiente.

Exemplo:

```bash
export QWEN_MODEL_DIGEST="$(curl -fsS http://127.0.0.1:11434/api/tags | python3 -c 'import json,sys; d=json.load(sys.stdin); print(next(m["digest"] for m in d["models"] if m["name"]=="qwen2.5-coder:0.5b"))')"
export QWEN_RUNTIME_VERSION="$(ollama --version | tr -d '\r')"
export QWEN_RUNTIME_DIGEST="sha256:$(sha256sum "$(command -v ollama)" | awk '{print $1}')"
```

> **Importante:** `QWEN_RUNTIME_VERSION` registra a versão reportada pelo binário em execução. Se o pacote da distribuição tiver uma versão diferente, ambas devem ser distinguidas na análise; uma não deve ser apresentada como se fosse a outra.

---

# Connectors

## Ollama

Conecta o Vortex a runtimes locais baseados em Ollama.

```bash
npm run test:ollama:contract
```

O contract test valida a fronteira do conector; sozinho, não é evidência de execução real de modelo.

## GitHub

```text
Agent / MCP Client
       ↓
GitHub MCP Connector
       ↓
Gateway / Credential Boundary
       ↓
GitHub API
```

O agente não deve receber automaticamente o token bruto do GitHub.

```bash
npm run test:github:contract
```

O contract test não é prova de side-effect real no GitHub.

---

# VUA — P&D

**VUA (Vortex Universal Adapter)** é a linha experimental para investigar uma interface comum entre agentes, runtimes e conectores.

```text
src/vortex/vua/
```

Estado: **P&D / experimental**.

Seu papel atual é validar arquitetura e contratos futuros **sem alterar o caminho funcional existente do Qwen**.

```bash
npm run test:vua
```

---

# Gateway

O Gateway fornece uma fronteira comum:

```text
InvokeRequest → Gateway → Connector / Runtime → ExecutionProof
```

A prova atual registra:

```text
proof_version
request_id
connector_id
executed
status
input_hash
output_hash
started_at
completed_at
duration_ms
runtime_id
credential_id
```

**Limite:** a prova demonstra o que o Gateway observou; não constitui, sozinha, prova criptográfica de side-effect externo.

---

# CI / Quality Gates

GitHub Actions valida gates de:

- headers GOS3;
- contrato de invocação;
- runtime loop;
- orchestrator;
- Grok contract;
- Qwen contract;
- VUA;
- Ollama contract;
- GitHub contract;
- Product Truth Matrix;
- E2E real do Qwen com Ollama;
- E2E real do Qwen no sandbox GOS3.

Principais comandos locais:

```bash
npm run test:gos3
npm run test:gateway
npm run test:vua
npm run test:ollama:contract
npm run test:github:contract
npm run build
```

> **CI verde prova somente os checks definidos pelo workflow. Não amplia automaticamente o claim do que foi verificado.**

---

# GOS3 e rastreabilidade

**GOS3 — Gang of Seven Senior Scrum** é o modelo de colaboração e governança utilizado no projeto.

> **Mexeu, deixa rastro.**

Mudança relevante deve ser rastreável por:

```text
DOR
 ↓
ISSUE / PROPOSTA
 ↓
IMPLEMENTAÇÃO
 ↓
TESTE
 ↓
EXECUÇÃO
 ↓
EVIDÊNCIA
 ↓
REVISÃO
 ↓
PR / COMMIT
```

Provenance registra **quem participou e em qual contexto**; evidência registra **o que efetivamente aconteceu**.

---

# Segurança e autoridade

```text
IDENTIDADE
    ↓
AUTORIDADE
    ↓
CAPACIDADE
    ↓
INVOCATION
    ↓
EXECUÇÃO
```

Possuir uma credencial ou connector não significa possuir autoridade irrestrita.

As regras devem considerar menor privilégio, separação de credenciais, timeout, `dry_run`, capability boundaries, auditoria, provenance e revisão por PR.

---

# Roadmap

## P0 — Prova forte de side-effect

Fechar a diferença entre execução observada e efeito externo comprovado, com possíveis execution receipts, timestamps verificáveis, runtime identity, side-effect log, assinatura e cadeia de evidência.

## P1 — Contrato mais forte

- tipagem completa de `result` e `error`;
- erros estruturados;
- compatibilidade entre versões;
- regras de `dry_run`;
- evidência obrigatória quando aplicável.

## P1 — Federation

Discovery/scheduling por capacidade:

```text
architecture
os
cpu
memory
gpu
backend
tools
permissions
```

## P2 — Trust chain

```text
identity → authority → delegation → invocation
→ runtime → execution → evidence → accountability → revocation
```

Cada camada só deve ser marcada como implementada quando houver artefato e teste correspondentes.

---

# Quick Start

```bash
git clone https://github.com/scoobiii/vortex.git
cd vortex
npm ci
```

### Núcleo

```bash
npm run test:contract
npm run test:runtime-loop
npm run test:orchestrator
npm run test:grok
npm run test:qwen05b:contract
```

### Gateway e conectores

```bash
npm run test:gateway
npm run test:ollama:contract
npm run test:github:contract
```

### P&D

```bash
npm run test:vua
```

### Qwen real

```bash
npm run test:qwen05b:e2e
npm run test:qwen05b:sandbox:e2e
```

Para execução real local, configure primeiro as três variáveis de proveniência descritas na seção **Qwen 0.5B — runtime funcional**.

### Build

```bash
npm run build
```

---

# Documentação

| Documento | Finalidade |
|---|---|
| [`docs/PRODUCT-TRUTH.md`](docs/PRODUCT-TRUTH.md) | matriz canônica do que é e não é comprovado |
| [`spec/invocation-contract.md`](spec/invocation-contract.md) | contrato de invocação |
| [`docs/runtime-federation.md`](docs/runtime-federation.md) | arquitetura de federation |
| [`docs/gos3-provenance.md`](docs/gos3-provenance.md) | provenance e rastreabilidade |
| [`docs/PLAYBOOK.md`](docs/PLAYBOOK.md) | processo operacional |
| [`docs/BACKLOG.md`](docs/BACKLOG.md) | backlog e próximos trabalhos |
| [`docs/decisions.md`](docs/decisions.md) | decisões arquiteturais |
| [`docs/team.md`](docs/team.md) | agentes e papéis |

---

# O que o Vortex não é

Vortex não é:

- um chatbot;
- um simples wrapper de API;
- um selo de certificação;
- um dashboard que declara sucesso sem evidência;
- um sandbox único obrigatório;
- uma promessa de execução universal;
- uma substituição para GitHub;
- uma substituição para runtimes especializados.

O Vortex é a camada de **contrato, execução e proveniência verificável** entre agentes e runtimes.

---

# Regra final

> **Código existir não significa que código rodou.**
>
> **Execução observada não significa automaticamente side-effect comprovado.**
>
> **Proof over prose. HASH + TEMPO + LOG.**
