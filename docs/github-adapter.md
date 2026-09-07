# Vortex GitHub Adapter

O GitHub Adapter é a integração online do Vortex. Ele **não faz parte do caminho obrigatório de execução local**.

```text
OFFLINE
Agent
  ↓
Vortex local-first
  ↓
Execution Proof + Benchmark
  ↓
local durable store

ONLINE
local store
  ↓
/v1/sync
  ↓
Vortex sync receiver
  ↓
GitHub Adapter
  ↓
repository state + PR + CI checks
  ↓
Vortex validation
```

## Responsabilidades

O adapter é deliberadamente read-only nesta primeira implementação:

- resolve `repository + ref` para o commit efetivo;
- lê estado de Pull Request;
- lê GitHub Check Runs;
- valida que o commit esperado ainda é o commit da referência;
- valida que CI está concluído e `success`;
- valida, quando informado, que o PR está aberto e aponta para o mesmo commit;
- devolve razões explícitas quando a validação falha.

Ele **não**:

- executa código;
- altera branch;
- cria commit;
- faz merge;
- armazena token em Execution Proof;
- transforma GitHub em requisito para execução offline.

## Configuração

A implementação usa `HttpGitHubAdapter`:

```ts
const adapter = new HttpGitHubAdapter({
  token: process.env.GITHUB_TOKEN,
});

const result = await adapter.validate(
  "scoobiii/vortex",
  "feature/proof",
  expectedCommit,
  pullRequestNumber,
);
```

O token é enviado somente no header `Authorization: Bearer ...` e não é incluído em proofs, benchmarks ou logs do adapter.

## Regra de validação

Uma validação online é válida somente quando:

```text
repository ref commit == expected commit
AND
CI checks == completed/success
AND
PR, se informado, == open
AND
PR head == repository ref commit
```

Qualquer divergência produz `valid: false` e uma lista de razões.

## Segurança

Para produção, prefira GitHub App/short-lived credentials quando a implantação exigir identidade de aplicação. O Vortex não deve persistir credenciais no store local de proofs.

O adapter é uma fronteira de integração. Política, autoridade de merge/deploy e aprovação humana continuam fora dele.
