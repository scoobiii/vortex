> **GOS3** · agente: `GPT` · papel: `Maintainer / Engineering Agent`
> fase: `Runtime Federation → Validation Plan` · data: `2026-09-06`
> antes: Vortex documenta runtime federation conceitual, mas não fixa a sequência operacional de validação local → LLM apps.
> depois: define teste reproduzível para Termux nativo, Alpine, Qwen 0.5B, persistência e depois GPT/outros LLMs.
> base: branch `docs/termux-qwen-gpt-federation`
> assinatura: `GPT · Maintainer / Engineering Agent · GOS3`

# Test Matrix — Termux nativo → Alpine → Qwen 0.5B → GPT → demais LLMs

## 1. Objetivo

Validar o Vortex começando pelo ambiente local mais controlável e avançando para LLMs externos, sem confundir **modelo**, **runtime**, **connector**, **persistência** e **evidência**.

Sequência normativa:

```text
T0  Vortex no Termux nativo
        ↓
T1  Vortex no Alpine/proot
        ↓
T2  Qwen 0.5B via runtime local
        ↓
T3  persistência local
        ↓
T4  Universal Vortex Connector
        ↓
T5  GPT app
        ↓
T6  demais LLM apps
        ↓
T7  execução paralela / 24 deliverables
        ↓
T8  CI online + evidência independente
```

Cada etapa deve produzir evidência. Uma etapa posterior não transforma uma anterior não verificada em PASS.

## 2. O que precisa ser persistido?

**SQLite não é requisito para o primeiro teste de execução.**

É recomendado como backend local de persistência quando o Vortex precisar sobreviver ao encerramento do processo e manter estado estruturado.

### Sem SQLite

É suficiente para demonstrar:

- instalação;
- invocation;
- execução;
- stdout/stderr;
- exit code;
- receipt em memória ou artefato de arquivo;
- connector básico.

### Com SQLite

Passa a ser útil para demonstrar:

- histórico de invocações;
- tasks e estados;
- receipts/evidence metadata;
- memória de sessão;
- recuperação após restart;
- idempotência/deduplicação;
- consultas do scheduler;
- estado compartilhado local.

Portanto:

```text
SQLite = persistência recomendada, não pré-condição do runtime mínimo.
```

O contrato deve permanecer independente do mecanismo de armazenamento.

## 3. Teste T0 — Termux nativo

Objetivo: provar que o Vortex executa diretamente no Android/Termux, sem depender de Alpine/proot.

Pré-condições:

```text
Termux
Git
Node.js compatível
npm
Python 3 (se usado pelo runtime)
```

Procedimento:

```bash
pkg update
pkg install git nodejs python

git clone https://github.com/scoobiii/vortex
cd vortex
npm install
npm test
```

Os comandos acima são **procedimento-alvo de documentação** até serem confirmados contra os scripts reais do branch testado.

Evidência mínima:

```text
commit SHA
OS/runtime
node --version
npm --version
command executed
exit_code
stdout/stderr
elapsed time
receipt/evidence hash
```

Critério:

```text
T0 = PASS somente se a execução real for observada e registrada.
```

## 4. Teste T1 — Alpine/proot

Objetivo: verificar portabilidade do mesmo contrato em ambiente Linux isolado sobre o Android.

Modelo:

```text
Android
  └── Termux
       └── proot-distro Alpine
            └── Vortex
```

Validar separadamente:

- instalação de dependências;
- acesso ao filesystem do Vortex;
- rede, quando necessária;
- execução do runtime;
- compatibilidade ARM64;
- limites de memória;
- persistência;
- evidência.

O resultado de T1 não substitui T0: os dois ambientes são runtimes distintos.

## 5. Teste T2 — Qwen 0.5B

Objetivo: usar um modelo pequeno local como **LLM executor/proposer**, sem conceder ao modelo autoridade direta sobre GitHub.

Arquitetura:

```text
Qwen 0.5B
    │
    ▼
Vortex Connector
    │
    ▼
Invocation Contract
    │
    ▼
Vortex Runtime
    │
    ├── tools
    ├── memory
    └── evidence
```

O modelo deve poder solicitar uma tarefa, mas a autorização é definida pelo Vortex.

Exemplo conceitual:

```json
{
  "task_id": "QWEN-T01",
  "agent": "qwen-0.5b",
  "capabilities": ["runtime.execute", "memory.read", "memory.write"],
  "task": "executar teste determinístico e produzir receipt"
}
```

O teste deve verificar também comportamento negativo:

```text
Qwen solicita repo.write
        ↓
capability ausente
        ↓
REJECTED / NOT_AUTHORIZED
```

Isso é parte da prova de segurança.

## 6. Teste T3 — Persistência SQLite

Depois de T0/T1/T2 funcionarem, testar persistência.

Fluxo mínimo:

```text
invocation #1
    ↓
execute
    ↓
receipt
    ↓
SQLite
    ↓
process restart
    ↓
load receipt/state
    ↓
verify same invocation
```

Casos obrigatórios:

1. inserir invocation;
2. registrar estado;
3. registrar receipt/evidence metadata;
4. encerrar processo;
5. iniciar novamente;
6. recuperar invocation;
7. verificar integridade;
8. impedir duplicação indevida da mesma `invocation_id`.

SQLite deve armazenar estado/metadados, não credenciais secretas em texto puro.

## 7. Teste T4 — Universal Vortex Connector

O connector deve abstrair o LLM do mecanismo de execução.

Interfaces alvo:

```text
HTTP/REST
OpenAI-compatible
MCP
CLI
SDK
local process
remote gateway
```

Todos convergem para o mesmo contrato Vortex.

```text
Gemini ─┐
GPT ────┤
Qwen ───┤
Claude ─┤──→ Universal Connector → Vortex
Manus ──┤
... ────┘
```

A presença ou ausência de connector nativo no aplicativo LLM não pode alterar as regras de autoridade do Vortex.

## 8. Teste T5 — GPT app

Depois do caminho local estar validado, integrar a própria app GPT através do conector disponível para o ambiente.

O teste deve separar:

```text
GPT app
  ≠
Vortex connector
  ≠
Vortex runtime
  ≠
GitHub credential
```

A credencial GitHub, quando necessária, permanece no componente autorizado de execução. O prompt do modelo não deve receber segredo.

Casos:

- leitura autorizada;
- execução autorizada;
- escrita autorizada;
- tentativa de capacidade não autorizada;
- receipt;
- recuperação do estado;
- erro/retry.

## 9. Teste T6 — demais LLMs

Repetir a mesma workload e o mesmo conjunto de critérios para:

```text
Gemini
Claude
Qwen
DeepSeek
Manus
Perplexity
xAI/Grok
outros adapters
```

O agente não deve ser certificado por nome. A certificação deve ser por:

```text
adapter
identity
capabilities
execution evidence
CI/test result
```

Isso permite que novos agentes sejam adicionados sem alterar o núcleo do protocolo.

## 10. Teste T7 — 24 deliverables

Após validar um único agente, executar uma workload de 24 tarefas.

```text
D01 D02 D03 ... D24
 │   │   │       │
 └───┴───┴───────┘
          ↓
    Vortex Orchestrator
          ↓
     fan-out paralelo
          ↓
       receipts
          ↓
     fan-in / review
          ↓
       final state
```

Cada task deve possuir identidade própria e capability explícita.

O sucesso global não pode ser calculado apenas por quantidade de respostas do LLM. Deve considerar execução, evidência, estado e critérios de aceitação.

## 11. Matriz de aceitação

| Etapa | Execução real | Persistência | Evidence | Capability isolation | CI |
|---|---:|---:|---:|---:|---:|
| T0 Termux | obrigatório | opcional | obrigatório | obrigatório | posterior |
| T1 Alpine | obrigatório | opcional | obrigatório | obrigatório | posterior |
| T2 Qwen | obrigatório | opcional | obrigatório | obrigatório | posterior |
| T3 SQLite | obrigatório | obrigatório | obrigatório | obrigatório | posterior |
| T4 Connector | obrigatório | recomendado | obrigatório | obrigatório | obrigatório |
| T5 GPT | obrigatório | recomendado | obrigatório | obrigatório | obrigatório |
| T6 demais LLMs | obrigatório | recomendado | obrigatório | obrigatório | obrigatório |
| T7 24 tasks | obrigatório | obrigatório | obrigatório | obrigatório | obrigatório |

## 12. Regra contra “LLM galo cego”

Um LLM é considerado **integrado ao Vortex** somente quando consegue operar por uma interface documentada e recebe estado/evidência suficientes para continuar o trabalho.

Não significa que o modelo recebe acesso irrestrito ao repositório.

A meta é:

```text
LLM sem visão do runtime
        ↓
Vortex Connector
        ↓
capability discovery
        ↓
invocation
        ↓
execution
        ↓
receipt
        ↓
state/memory
        ↓
próxima decisão do agente
```

Assim o modelo deixa de ser “galo cego” sem transformar o modelo em administrador do sistema.

## 13. Ordem de implementação

```text
1. documentar contrato e critérios
2. fechar teste Termux nativo
3. fechar teste Alpine
4. conectar Qwen 0.5B
5. adicionar SQLite somente onde o estado exigir persistência
6. fechar Universal Connector
7. integrar GPT app
8. integrar demais LLMs
9. executar 24 deliverables
10. CI online
11. benchmark/harness
```

### Regra de verdade

Nenhuma etapa será marcada como `PASS` por documentação, intenção, código existente ou resposta textual do agente.

A marcação deve apontar para a execução e sua evidência.

```text
PROMETIDO ≠ IMPLEMENTADO ≠ EXECUTADO ≠ VERIFIED
```

Essa regra é consistente com o PLAYBOOK do Vortex, que exige execução observada e trata resultado não observado como **não verificado**. 
