# Runtime Execution Model — Vortex

> **GOS3** · processo: Agile/Scrum · status: **proposta / Technical Refinement** · data: 2026-08-23
>
> Regra: **LLM propõe; compilador/runtime decide.** Texto não é execução.

## 1. O que mudou

Antes, o fluxo prático era:

```text
baixar repo → instalar dependências → testar localmente
                         │
                         └→ ou executar no GAISTUDIO/Gemini
```

Isso continua válido. O Vortex adiciona uma camada acima desse fluxo: o agente não precisa assumir previamente onde o código será executado. Ele produz uma invocação conforme o contrato; um runtime compatível executa; a execução devolve telemetria e evidência.

```text
LLM / Agent
    │
    │ proposta + código + constraints
    ▼
Vortex invocation-contract
    │
    ▼
Capability discovery / scheduler
    │
    ├── A23 / Termux
    ├── VPS / Linux
    ├── GCloud VM / Job / Container
    ├── Colab runtime
    └── outro executor compatível
    │
    ▼
Nx1 execution
    │
    ├── executed
    ├── stdout
    ├── stderr
    ├── exit_code
    ├── duration_ms
    ├── runtime_id
    └── evidence_hash
```

## 2. O Vortex tem sandbox/runtime próprio?

**Não no sentido de uma única máquina central compartilhada.** O Vortex é o protocolo/orquestrador de execução verificável. Um runtime pode ser local, remoto ou fornecido por outro serviço.

O sandbox atualmente disponível em implementações como zAI pode servir como **runtime adapter**, desde que satisfaça o contrato. Uma função que apenas simula Python ou retorna dados artificiais não pode declarar `executed: true` como prova de execução real.

Portanto:

- Vortex = contrato + governança + seleção/integração de runtimes;
- runtime = executor efetivo;
- GitHub = estado/proveniência, não sandbox por padrão;
- CLI GitHub = ferramenta de integração/automação, não prova automática de execução;
- GAISTUDIO = ambiente de agente/modelo, não deve ser confundido com runtime universal;
- A23/VPS/GCloud/Colab = possíveis executores, conforme capabilities reais.

## 3. Onde o código é testado?

A resposta correta é: **no runtime que realmente executa o teste**.

O agente pode preparar código no ambiente de conversa, mas a afirmação de que o código passou precisa vir de uma execução observável.

### Exemplo local

```text
Agent → Git → A23/Termux → compiler/runtime → tests → evidence
```

### Exemplo remoto

```text
Agent → Git → Vortex → GCloud/VPS → compiler/runtime → tests → evidence
```

### Exemplo CI

```text
Agent → PR → GitHub Actions → build/test → logs/artifact → review
```

GitHub Actions é particularmente útil para builds reproduzíveis. Entretanto, o simples fato de um workflow existir não prova que ele rodou com sucesso: é necessário um run verificável e seus artefatos/logs.

## 4. "LLM só respeita compilador"

Como princípio de engenharia, a frase fica:

> **LLM pode propor; somente uma execução verificável pode afirmar que o código funciona. O compilador, interpretador, testes e runtime são os árbitros da execução.**

O modelo pode escrever:

```text
"compila"
"testei"
"funciona"
```

Isso é uma afirmação textual.

A evidência é outra coisa:

```text
compiler exit_code = 0
runtime exit_code = 0
stdout/stderr registrados
duration_ms real
runtime_id conhecido
artefato/hash identificável
```

Se o runtime não executou, a resposta deve dizer `executed: false` ou `not_executed`, nunca fabricar sucesso.

## 5. Write once, run anywhere — sem marketing enganoso

O objetivo é transportar **código + contrato + testes**, não prometer que um binário ARM64, CUDA, Vulkan ou Java rodará magicamente em qualquer máquina.

```text
               mesmo artefato lógico
                       │
              capability discovery
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
     ARM64           x86_64          GPU
     A23             VPS             GCloud
       │               │               │
    compile          compile         compile
       │               │               │
       └───────────────┼───────────────┘
                       ▼
                  execution
```

Quando uma dependência é específica de plataforma, o scheduler deve selecionar um perfil de build/runtime ou declarar incompatibilidade.

## 6. Perfil de runtime

Cada executor deve anunciar, no mínimo:

```json
{
  "runtime_id": "a23-termux-01",
  "os": "android-termux",
  "arch": "arm64",
  "cpu": true,
  "gpu": false,
  "gpu_backend": null,
  "memory_mb": 3500,
  "languages": ["node", "python"],
  "network": "restricted",
  "capabilities": ["compile", "test", "execute"],
  "isolation": "proot-or-process",
  "version": "..."
}
```

A declaração de `gpu: true` só é válida quando o runtime realmente expõe e testa o backend correspondente. Ter uma GPU física no telefone não significa que Node/Python ou o processo do agente tenha acesso a ela.

## 7. Quem faz o quê

| Camada | Papel |
|---|---|
| LLM | raciocinar, propor código, escolher estratégia |
| GOS3 | coordenar discovery, refinement, architecture, review e aceite |
| Vortex | contrato, invocation, evidência e integração de runtime |
| Scheduler | selecionar runtime compatível |
| Compiler/interpreter | validar/transformar o código |
| Runtime | executar de fato |
| Test runner | produzir resultado verificável |
| Git/GitHub | versionar código, issues, PRs e proveniência |
| PO humano | aprovar mudanças de contrato/arquitetura quando exigido |

## 8. Regra de ouro

**Não perguntar "onde o LLM disse que rodou?". Perguntar "qual runtime rodou, com qual comando, qual exit code, quais logs e qual evidência?"**

Isso é a transição de um sistema orientado por conversa para um sistema orientado por execução verificável.
