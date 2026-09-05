> **GOS3** · agente: `Manus` · papel: `Maintainer / DevOps` (ver docs/team.md)
> fase: `Onboarding → Runtime Federation` · data: `2026-08-30` · hora: `01:23:42 UTC`
> antes: documentação do adaptador MCP sem cabeçalho GOS3 padronizado.
> depois: documentação operacional do MCP local com GitHub, Vortex, GoS3/S3 e Qwen no Ollama.
> base: commit `e49ef90`
> assinatura: `Manus · Maintainer / DevOps · GOS3`

# Vortex GitHub GoS3 MCP

Este projeto adiciona um único servidor MCP por **stdio** ao repositório Vortex. Ele reúne três grupos de operações: chamadas autenticadas à API REST do GitHub, execução local com evidência estruturada conforme o contrato Vortex v0.1 e operações básicas compatíveis com S3 para o componente GoS3.

## Instalação e execução

```bash
npm install
npm run build:mcp
npm start:mcp
```

O processo não imprime segredos nem os recebe pela linha de comando. Configure as variáveis no ambiente do processo MCP.

| Variável | Finalidade |
|---|---|
| `GITHUB_TOKEN` | Opcional quando o host injeta OAuth; usado pela ferramenta REST do GitHub |
| `GITHUB_API_URL` | Opcional; padrão `https://api.github.com`, ou URL de GitHub Enterprise |
| `AWS_REGION` | Região S3; padrão `us-east-1` |
| `S3_ENDPOINT` | Endpoint S3 compatível, quando não for AWS S3 |
| `S3_FORCE_PATH_STYLE` | Use `true` em alguns provedores S3 compatíveis |
| `AWS_ACCESS_KEY_ID` | Credencial S3 fornecida pelo ambiente seguro |
| `AWS_SECRET_ACCESS_KEY` | Credencial S3 fornecida pelo ambiente seguro |
| `AWS_SESSION_TOKEN` | Opcional para credenciais temporárias |
| `VORTEX_RUNTIME_ID` | Identificador declarativo do runtime; padrão `local` |

## Ferramentas expostas

`vortex_invoke` executa um binário explicitamente indicado e retorna `stdout`, `stderr`, código de saída, duração, runtime e hash SHA-256. `github_request` acessa endpoints REST do GitHub com o token injetado. As ferramentas `gos3_*` listam buckets, listam objetos e leem, gravam ou excluem objetos S3.

A execução local é deliberadamente explícita: não há shell interpretado; o comando e os argumentos são enviados separadamente a `execFile`. Ainda assim, o host que iniciar o processo deve aplicar uma política de allowlist de comandos e diretórios se o ambiente não for totalmente confiável.

## OAuth do GitHub

A autenticação OAuth deve ser feita pelo conector GitHub oficial do host MCP. O adaptador também aceita `GITHUB_TOKEN` quando for executado fora do host, mas não inclui token no código, no arquivo de configuração ou na URL.

## Estado atual do GoS3

O repositório `scoobiii/vortex` descreve GoS3 como governança, contratos e evidência de execução; ele não publica um servidor GoS3 remoto. Por isso, a camada `gos3_*` usa a API S3 compatível e requer endpoint e credenciais definidos pelo operador.

## Qwen local no A23

Para baixo consumo de memória, use o Ollama já instalado no A23 com o modelo `qwen2.5-coder:0.5b`. O adaptador MCP conversa com o endpoint local `127.0.0.1:11434` e limita o contexto a 2048 tokens por padrão. Reduza `OLLAMA_CONTEXT` se o aparelho ficar sem memória.

Exemplo no Termux:

```bash
ollama serve
# Em outro terminal, confirme que o modelo está instalado:
ollama list
```

Em outro terminal, inicie o adaptador MCP:

```bash
npm run start:mcp
```

A ferramenta `qwen_chat` acessa o servidor local pelas variáveis `OLLAMA_URL`, `OLLAMA_MODEL` e `OLLAMA_CONTEXT`. Para o seu ambiente, use `OLLAMA_MODEL=qwen2.5-coder:0.5b`. O modelo fica em um processo separado para permitir reinicialização independente e reduzir o consumo do adaptador.

No A23, comece com CPU. O backend Vulkan/WebGPU pode ser testado depois, mas não deve ser o padrão: drivers móveis, cópias de memória e suporte variável podem resultar em desempenho inferior ao CPU para um modelo de apenas 0,5B. O benchmark real no aparelho deve decidir qualquer ativação de aceleração gráfica.
