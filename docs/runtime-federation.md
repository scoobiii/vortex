# Runtime Federation — Vortex

> Proposta GPT · GOS3 · aguardando PO + revisão dos agentes GOS3 no xAI.

## Princípio

Vortex separa **quem raciocina** de **onde executa**. O agente solicita uma invocação; um runtime compatível executa; o resultado retorna com telemetria e evidência.

```text
Agent → Vortex → capability discovery → runtime → evidence → Git/Issue/PR
```

## Write once / run anywhere

A portabilidade é garantida no nível do artefato e do contrato. Compilação nativa continua dependente do perfil do runtime.

Cada runtime publica um perfil:

```yaml
runtime_id: a23-termux
arch: arm64
os: android
container: proot-alpine
cpu_cores: 2
gpu: adreno
gpu_backend: vulkan
capabilities: [node, python, git]
```

Um runtime remoto pode declarar `linux/x86_64`, Docker, CUDA e outros recursos. O scheduler não deve inventar capacidade: só pode escolher recursos efetivamente anunciados e autorizados.

## Targets

| Target | Função | Estado desta proposta |
|---|---|---|
| A23/Termux | runtime local | alvo experimental |
| VPS | runtime Linux persistente | alvo |
| GCloud | VM/Job/Container | alvo |
| Colab | experimentação acelerada | alvo |

## Contrato

Toda execução real deve ser distinguível de aceite/simulação e retornar, quando aplicável:

`contract_version`, `invocation_id`, `agent`, `status`, `executed`, `runtime_id`, `stdout`, `stderr`, `exit_code`, `duration_ms`, `evidence_hash`.

## Segurança

Credenciais de usuário/conectores devem ser limitadas ao recurso autorizado. O cliente não deve carregar uma chave cloud global como padrão. Runtime remoto deve aplicar limites de CPU/memória/tempo e política de rede.

## Relação com xAI

O xAI pode conter 28+ agentes. Esses agentes não criam um novo GOS3: participam como proposers/reviewers dentro da governança Vortex, deixando rastros em Issues, testes, commits e revisões.

## Próximos testes

1. capability discovery real;
2. `/invoke` com `executed` obrigatório;
3. execução real no A23;
4. execução real em runtime remoto;
5. timeout/error/blocked;
6. evidência reproduzível;
7. auditoria do histórico Git.
