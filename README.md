> **GOS3** · agente: `GPT` · papel: `Maintainer / Engineering Agent`
> fase: `Technical Refinement → Runtime Federation`
> status: **proposta — aguardando aprovação do PO e revisão dos agentes GOS3**
> regra: **mexeu, deixa rastro** — mudança relevante deve apontar para dor → issue → proposta → teste → execução → evidência → revisão → aprovação → commit.

# Vortex

![USE VORTEX! - Python, LLMs, Sandbox & Runtime](docs/images/use-vortex-cover.png)

> **Aprenda de verdade. Sem "funcionou aqui". Só resultados reais: HASH + TEMPO + LOG.**

**Vortex** é uma proposta de runtime/protocolo para permitir que agentes LLM solicitem execução de tarefas em runtimes compatíveis e recebam uma resposta estruturada sobre essa execução.

O objetivo é separar claramente:

- **quem solicita** a execução;
- **o que foi solicitado**;
- **onde foi executado**;
- **quais capacidades estavam disponíveis**;
- **o que realmente aconteceu**;
- **qual evidência pode ser auditada**.

A ideia central é:

```text
NxN = coordenação, backlog e estado compartilhado

Nx1 = execução isolada de cada invocação

Vortex = contrato entre agente, executor e evidência
```

---

## Princípio fundamental

> **Código existir não significa que código rodou.**
>
> **`executed: true` também não deve ser tratado como prova suficiente de side-effect.**

O Vortex separa quatro estados que frequentemente são confundidos:

```text
PROMISED
   │
   ▼
IMPLEMENTED
   │
   ▼
EXECUTED
   │
   ▼
VERIFIED
```

Uma implementação pode existir sem ter sido executada.

Uma execução pode ocorrer sem produzir evidência suficiente.

Uma evidência pode existir sem provar o efeito alegado.

Portanto, claims operacionais devem apontar para artefatos reproduzíveis.

---

## Estado atual

O Vortex encontra-se em **Technical Refinement**.

### Já implementado/provado

- contrato de invocação v0.1;
- primeiro Runtime Reference para Grok;
- adapter Grok;
- validação básica do contrato;
- fixtures `ping`, `echo` e `dry`;
- testes automatizados do adapter;
- governança GOS3;
- documentação de backlog, handoff e provenance;
- infraestrutura de snapshot do repositório para agentes que não possuem sandbox;
- publicação do snapshot através de CI/GitHub Pages.

### Ainda não fechado

- prova criptograficamente/verificavelmente forte de side-effect real;
- tipagem completa de `result` e `error` no contrato;
- generalização dos adapters;
- onboarding dos demais agentes;
- runtime federation completa;
- cadeia de identidade, autoridade e delegação;
- mecanismo definitivo de evidência, assinatura e accountability.

**Nada acima deve ser tratado como concluído apenas porque está descrito em documentação.**

---

# Invocation Contract

O contrato v0.1 define a interface mínima entre uma solicitação e seu executor.

Uma solicitação contém:

```text
contract_version
invocation_id
agent
action
payload
context
```

O contexto inclui:

```text
sandbox
timeout_ms
dry_run
```

A resposta contém:

```text
invocation_id
agent
executed
result
error
logs
duration_ms
```

O campo `executed` é obrigatório.

Porém, existe uma dívida técnica conhecida:

```text
executed: true
       ≠
prova de side-effect externo
```

Na implementação atual do Runtime Reference, `executed` ainda deriva do contexto de execução (`!dry_run`). Isso é suficiente para demonstrar o comportamento do contrato atual, mas **não é uma prova independente de efeito externo**.

O teste correspondente existe justamente para tornar essa limitação explícita.

---

# Evidência

O objetivo do Vortex é evoluir de:

```text
"o agente disse que executou"
```

para:

```text
invocation
    │
    ├── request
    ├── runtime_id
    ├── capabilities
    ├── execution
    ├── stdout
    ├── stderr
    ├── exit_code
    ├── duration_ms
    ├── timestamp
    └── evidence
            │
            ├── hash
            ├── receipt
            └── assinatura
```

Uma futura implementação poderá produzir uma cadeia verificável semelhante a:

```text
IDENTITY
   ↓
AUTHORITY
   ↓
DELEGATION
   ↓
INVOCATION
   ↓
RUNTIME
   ↓
EXECUTION
   ↓
EVIDENCE
   ↓
ACCOUNTABILITY
```

Essa arquitetura é **direção de projeto**, não uma alegação de que todas essas camadas já estejam implementadas.

---

# Runtime Federation

O Vortex não precisa pressupor que todos os agentes executem no mesmo computador.

A proposta de **runtime federation** permite separar o agente do executor:

```text
                    Agent
                      │
                      ▼
              Vortex Gateway
                      │
                      ▼
             Invocation Contract
                      │
                      ▼
          Runtime Capability Discovery
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
        A23          VPS        Cloud
       ARM64        Linux       GPU/CPU
       Termux       Docker      Jobs
          │           │           │
          └───────────┼───────────┘
                      ▼
                 Execution
                      │
                      ▼
                  Evidence
```

O scheduler deverá selecionar um runtime compatível com a tarefa considerando, por exemplo:

- arquitetura;
- sistema operacional;
- memória;
- CPU;
- GPU;
- backend disponível;
- ferramentas instaladas;
- limites de execução;
- permissões;
- credenciais autorizadas.

### Importante

Uma credencial ou conector de usuário **não equivale automaticamente a autoridade irrestrita sobre o runtime**.

Capacidade e autoridade devem ser explicitamente declaradas.

---

# Write once, run anywhere

O objetivo não é prometer que qualquer binário executará em qualquer máquina.

O princípio significa:

> **o contrato e o artefato de execução devem ser portáveis; o runtime decide se possui capacidade compatível.**

Por exemplo:

```text
               mesmo Invocation Contract
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
        ARM64           x86            GPU
        Termux          VPS           Cloud
          │              │              │
          ▼              ▼              ▼
       executor       executor       executor
```

Se o runtime não possuir capacidade suficiente, a execução deve ser rejeitada ou reportada como não executada.

Não deve ser transformada artificialmente em `success`.

---

# GOS3

**GOS3 — Gang of Seven Senior Scrum** é o modelo de colaboração utilizado no desenvolvimento do Vortex.

O board original inclui:

```text
Gemini
Claude
GPT
Qwen
DeepSeek
Manus
Perplexity
```

O registro atual está em:

```text
docs/team.md
```

O conjunto de agentes não precisa permanecer hardcoded.

Agentes adicionais podem participar como:

- proposer;
- reviewer;
- validator;
- runtime reference;
- executor.

Participação de um agente, entretanto, não constitui certificação automática.

---

# GOS3 não é um badge

Termos como:

```text
Certified
Complete
100%
Production ready
Verified
```

não são evidência por si mesmos.

Uma afirmação operacional deve apontar para:

```text
claim
  ↓
artifact
  ↓
test
  ↓
execution
  ↓
evidence
  ↓
review
```

A regra operacional é:

> **Mexeu, deixa rastro.**

Fluxo esperado:

```text
dor
 ↓
issue
 ↓
proposta
 ↓
teste reproduzível
 ↓
execução
 ↓
evidência
 ↓
revisão
 ↓
aprovação
 ↓
commit / PR
 ↓
backlog atualizado
```

---

# Runtime Reference: Grok

O primeiro runtime de referência é o adapter Grok.

A implementação atual possui:

```text
src/agents/grok/
├── README.md
├── adapter/
│   ├── contract.ts
│   ├── handler.ts
│   └── index.ts
└── tests/
    └── contract.test.ts
```

O teste documentado possui:

```text
19 assertions
19 passed
0 failed
```

O teste também contém explicitamente o caso que demonstra o gap entre:

```text
executed: true
```

e:

```text
side-effect verificável
```

Isso é importante: **o teste passar não significa que o gap foi resolvido**.

Significa que o comportamento atual foi reproduzido e documentado.

---

# CI e agentes sem sandbox

Nem todo agente possui acesso direto ao filesystem ou ao sandbox do Vortex.

Para esse cenário, o projeto possui um mecanismo de publicação de snapshot do repositório via CI.

A ideia é:

```text
Git repository
      │
      ▼
     CI
      │
      ▼
repository snapshot
      │
      ▼
HTTP-accessible artifact
      │
      ▼
agent without sandbox
```

Isso permite que um agente consulte uma representação do estado do repositório sem receber automaticamente acesso de escrita.

**Leitura do snapshot não concede autoridade para modificar o repositório.**

---

# Segurança e governança

Mudanças relacionadas a:

- contrato de invocação;
- segurança;
- acesso;
- autoridade;
- credenciais;
- execução externa;

devem passar pelo fluxo de governança definido em:

```text
docs/PLAYBOOK.md
```

A política diferencia:

```text
leitura
  ↓
proposta
  ↓
escrita
  ↓
publicação
```

Escrever no repositório não implica automaticamente:

```text
commit
push
merge
deploy
```

Essas ações pertencem a etapas distintas de autoridade.

---

# Provenance

A documentação de provenance registra a participação dos agentes no desenvolvimento.

Exemplos:

```text
docs/agents/gpt/
docs/gos3-provenance.md
docs/decisions.md
```

Esses arquivos documentam:

- agente;
- papel;
- fase;
- proposta;
- conectores;
- decisões;
- revisão;
- aprovação;
- artefatos relacionados.

Provenance é uma camada de rastreabilidade.

Ela **não substitui evidência de execução**.

---

# O que o Vortex não é

Vortex não é:

- um chatbot;
- uma rede social de agentes;
- um simples wrapper de API;
- um selo de certificação;
- um dashboard que declara sucesso;
- um sandbox único obrigatório;
- uma promessa de execução universal;
- uma substituição para GitHub;
- uma substituição para os runtimes especializados.

O Vortex pretende ser a camada de **contrato, execução e proveniência verificável** entre agentes e runtimes.

---

# Arquitetura conceitual

A arquitetura de longo prazo pode ser representada por:

```text
                 USER / SYSTEM
                       │
                       ▼
                    IDENTITY
                       │
                       ▼
                   AUTHORITY
                       │
                       ▼
                  DELEGATION
                       │
                       ▼
                  INVOCATION
                       │
                       ▼
              CAPABILITY DISCOVERY
                       │
                       ▼
                    RUNTIME
                       │
                       ▼
                   EXECUTION
                       │
                       ▼
                    EVIDENCE
                       │
                       ▼
                 ACCOUNTABILITY
                       │
                       ▼
                  REPUTATION
                       │
                       ▼
                   REVOCATION
```

As camadas abaixo de `EXECUTION` representam direção arquitetural futura quando ainda não houver implementação correspondente.

---

# Estrutura do projeto

Principais áreas:

```text
.
├── README.md
├── package.json
├── src/
│   └── agents/
│       └── grok/
├── specs/
│   └── invocation-contract.md
└── docs/
    ├── BACKLOG.md
    ├── CHANGELOG.md
    ├── PLAYBOOK.md
    ├── handoff.md
    ├── team.md
    ├── agents/
    ├── proposals/
    └── images/
        └── use-vortex-cover.png
```

A árvore detalhada deve ser mantida sincronizada com o estado real do repositório.

---

# Roadmap

## P0 — Evidência de execução

Fechar a diferença entre:

```text
executed: true
```

e:

```text
execução realmente comprovada
```

Possíveis componentes:

- execution receipt;
- timestamp;
- hash;
- runtime identity;
- side-effect log;
- assinatura;
- cadeia de evidência.

---

## P1 — Contrato

Fortalecer a validação do contrato:

- tipos de `result`;
- tipos de `error`;
- erros estruturados;
- regras de `dry_run`;
- compatibilidade entre versões;
- evidência obrigatória quando aplicável.

---

## P1 — Adapter template

Extrair um template genérico para novos runtimes/agentes:

```text
src/agents/_template/
```

O objetivo é evitar que cada adapter implemente uma interpretação diferente do contrato.

---

## P1 — Federation

Implementar discovery de capacidades:

```text
runtime_id
architecture
os
cpu
memory
gpu
backend
tools
permissions
```

O scheduler deve escolher somente runtimes compatíveis com a solicitação.

---

## P2 — Trust chain

Evoluir para:

```text
identity
authority
delegation
execution
evidence
accountability
revocation
```

Cada etapa deverá possuir um artefato verificável antes de ser considerada implementada.

---

# Documentação

Documentos importantes:

```text
docs/PLAYBOOK.md
docs/BACKLOG.md
docs/CHANGELOG.md
docs/handoff.md
docs/team.md
docs/gos3-provenance.md
docs/runtime-federation.md
docs/decisions.md
specs/invocation-contract.md
```

Propostas que ainda não foram aprovadas devem permanecer identificadas como propostas.

---

# Regra de verdade

O Vortex adota uma distinção explícita:

| Estado | Significado |
|---|---|
| **Promised** | descrito como objetivo |
| **Proposed** | existe uma proposta técnica |
| **Implemented** | existe implementação no repositório |
| **Executed** | foi executado em um runtime real |
| **Verified** | existe evidência suficiente para reproduzir/auditar o claim |

Não se deve promover um estado para outro apenas por documentação.

```text
documentado
    ≠
implementado
    ≠
executado
    ≠
verificado
```

---

# Princípio final

O Vortex existe para tornar uma pergunta simples auditável:

> **"O agente realmente fez o que disse que fez?"**

A resposta não deve depender apenas da palavra do agente.

Deve ser sustentada por:

```text
CONTRACT
   +
RUNTIME
   +
EXECUTION
   +
EVIDENCE
   +
PROVENANCE
   +
REVIEW
```

**Proof over prose.**

**HASH + TEMPO + LOG.**
