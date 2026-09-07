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

| Entregável | O que entrega | Estado atual |
|---|---|---|
| **Invocation Contract** | request/response comum, `invocation_id`, agente, ação, payload, contexto, `executed`, resultado, erro, logs e duração | **Implementado + testado** |
| **GOS3 Governance** | headers, rastreabilidade, política de mudança e gates de CI | **Implementado** |
| **Runtime Loop** | ciclo controlado de invocação, execução, resultado e controle de estado | **Implementado + testado** |
| **Orchestrator** | coordenação do fluxo de execução do agente | **Implementado + testado** |
| **Gateway** | fronteira comum para requests, connectors e execution proofs | **Implementado + testado** |
| **Qwen 2.5 Coder 0.5B** | adapter funcional para runtime local via Ollama/OpenAI-compatible API | **Implementado + E2E real em CI** |
| **Ollama Connector** | integração de runtime local sobre a camada existente | **Implementado + contract test** |
| **GitHub Connector** | fronteira MCP → Gateway para operações GitHub sem expor credencial diretamente ao agente | **Implementado + contract test** |
| **Grok Adapter** | adapter de referência e fixtures de contrato | **Implementado + testado** |
| **VUA** | adapter universal experimental para pesquisa de uma interface comum | **P&D / experimental** |
| **Provenance** | identidade da execução, hashes, runtime/modelo e artefatos de evidência | **Implementado em fluxos específicos** |
| **CI/CD** | gates de contrato, governança, truth matrix e E2E Qwen | **Implementado** |
| **Truth Model** | distinção entre `PROMISED`, `IMPLEMENTED`, `EXECUTED` e `VERIFIED` | **Implementado como regra** |

> **VUA é P&D. O runtime funcional do Qwen não depende de VUA.**

---

# Entregáveis por público

## 1. Usuário

O usuário precisa saber **o que pode pedir, o que foi executado e qual evidência existe**.

### O Vortex entrega

- forma padronizada de solicitar uma execução;
- identificação da invocação e do agente;
- indicação do runtime/conector quando disponível;
- resultado, erro, logs e duração;
- distinção entre `dry_run` e execução;
- evidência de execução nos fluxos que suportam provenance;
- hashes e artefatos para auditoria quando disponíveis;
- rejeição explícita quando o runtime não possui capacidade compatível;
- rastreabilidade da mudança e do artefato usado.

### Limite importante

```text
executed: true
      ≠
prova universal de side-effect externo
```

A prova forte de efeito externo ainda é uma evolução do projeto.

---

## 2. DevOps / SRE

O Vortex entrega uma **superfície operacional observável e controlável** para executar agentes e conectores.

### Entregáveis operacionais

- contratos versionados de invocação;
- timeout e contexto de execução;
- identificação de runtime e execução;
- stdout/stderr e exit code nos fluxos aplicáveis;
- duração da execução;
- hashes de artefatos de evidência;
- provenance de modelo/runtime quando aplicável;
- Gateway para separar agente, credencial e serviço externo;
- conectores isolados por capacidade;
- contract tests para impedir divergência;
- CI com gates obrigatórios;
- E2E real do Qwen em CI com captura de evidência;
- branch protection e revisão por PR;
- artefatos de CI para auditoria e troubleshooting.

### Critério operacional

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

Se uma dessas evidências não existir, o claim permanece **PARTIAL**, **NOT PROVEN** ou equivalente.

---

## 3. Agentes LLM

O Vortex fornece uma **superfície de invocação previsível**, com fronteiras explícitas de capacidade e autoridade.

### Entregáveis para agentes

- Invocation Contract único;
- `invocation_id` para rastrear solicitações;
- identificação do agente;
- `action` e `payload` estruturados;
- contexto de sandbox, timeout e `dry_run`;
- resposta e erro estruturados;
- logs e duração;
- Gateway para ferramentas/conectores;
- separação entre credencial e agente;
- provenance para distinguir afirmação de execução observada;
- documentação de capacidades e limites;
- contract tests para validar integrações.

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

Um agente só deve declarar uma tarefa concluída com base no artefato que comprova a etapa correspondente.

---

# Modelo de verdade

O Vortex usa estados explícitos para evitar claims inflados:

```text
PROMISED
   ↓
IMPLEMENTED
   ↓
EXECUTED
   ↓
VERIFIED
```

- **PROMISED** — proposto ou planejado.
- **IMPLEMENTED** — existe código/configuração correspondente.
- **EXECUTED** — houve execução observada.
- **VERIFIED** — há evidência suficiente, reproduzível e auditável para o claim específico.

Uma execução pode ser real sem constituir prova suficiente de um side-effect externo.

A matriz canônica de claims fica em [`docs/PRODUCT-TRUTH.md`](docs/PRODUCT-TRUTH.md).

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
Vortex
  ↓
Qwen Adapter
  ↓
Ollama
  ↓
qwen2.5-coder:0.5b
  ↓
resposta real
  ↓
provenance + evidence hash
```

O fluxo E2E captura, quando disponível no ambiente:

- modelo e digest;
- versão do runtime;
- hash do binário/runtime;
- execution id;
- stdout/stderr;
- exit code;
- duração;
- hash da evidência.

Comandos:

```bash
npm ci
npm run test:qwen05b:contract
npm run test:qwen05b:e2e
```

O E2E exige Ollama funcional e o modelo `qwen2.5-coder:0.5b`; mock não deve ser usado para classificar esse fluxo como execução real.

---

# Connectors

## Ollama

Conecta o Vortex a runtimes locais baseados em Ollama.

```bash
npm run test:ollama:contract
```

O contract test valida a fronteira do conector; sozinho, não é evidência de execução real de modelo.

## GitHub

O conector expõe uma fronteira MCP e encaminha operações ao Gateway:

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

Seu papel atual é validar arquitetura e contratos futuros sem alterar o caminho funcional existente do Qwen.

```bash
npm run test:vua
```

---

# Gateway

O Gateway fornece uma fronteira comum:

```text
InvokeRequest
    ↓
Gateway
    ↓
Connector / Runtime
    ↓
ExecutionProof
```

A prova atual registra, entre outros:

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

**Limite conhecido:** essa prova demonstra o que o Gateway observou; não constitui, sozinha, prova criptográfica de side-effect externo. Recibos assinados e accountability são evolução futura.

---

# CI / Quality Gates

GitHub Actions valida o estado do projeto com gates de:

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
- E2E real do Qwen com Ollama.

Comandos locais principais:

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

**GOS3 — Gang of Seven Senior Scrum** é o modelo de colaboração/governança utilizado no projeto.

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

O Vortex separa:

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
identity
→ authority
→ delegation
→ invocation
→ runtime
→ execution
→ evidence
→ accountability
→ revocation
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
```

### Build

```bash
npm run build
```

---

# Documentação

| Documento | Para quê |
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
- uma promessa de que qualquer binário roda em qualquer máquina;
- substituto do GitHub;
- substituto de runtimes especializados.

Vortex é a camada de **contrato + execução + gateway/conectores + evidência + proveniência** entre agentes e runtimes.

---

# Regra final

```text
Código existir
    ≠
Código executar
    ≠
Efeito acontecer
    ≠
Efeito ser comprovado
```

> **Proof over prose.**
>
> **HASH + TEMPO + LOG.**

A classificação definitiva de cada claim deve ser consultada na **Product Truth Matrix** e nos artefatos de CI/teste correspondentes.
