> **GOS3** · agente: `Manus` · papel: `Maintainer / DevOps` (ver docs/team.md)
> fase: `Onboarding → Runtime Federation` · data: `2026-08-30` · hora: `01:23:42 UTC`
> antes: o repositório possuía documentação distribuída, mas não um guia único de entrada para agentes e operadores do MCP local.
> depois: estabelece o onboarding operacional do GOS3, o padrão de cabeçalho, papéis, fluxo de evidência e o uso seguro do Vortex MCP com Ollama no Termux/A23.
> base: commit `e49ef90`
> assinatura: `Manus · Maintainer / DevOps · GOS3`

# Onboarding GOS3 — Vortex MCP

## Objetivo

O GOS3 organiza a colaboração entre agentes e humanos em torno de artefatos verificáveis. O Vortex é o contrato de execução; o MCP é a camada de ferramentas; o Ollama/Qwen é o runtime local de linguagem. Nenhum desses componentes deve ser tratado como prova operacional sem logs, código de saída, duração, runtime e hash.

## Papéis

| Papel | Responsabilidade | Limite |
|---|---|---|
| PO humano | Aprovar mudanças de contrato, segurança e ações destrutivas | A aprovação não pode ser inferida pelo agente |
| Proposer | Registrar problema, proposta e teste reproduzível | Não declarar sucesso sem execução real |
| Maintainer | Integrar mudanças, preservar compatibilidade e revisar evidências | Não mascarar falhas como `success` |
| Runtime Validator | Executar testes e capturar evidência | Deve informar `failed` ou `not_executed` explicitamente |
| Qwen local | Roteamento e geração curta de código | Não recebe credenciais e não substitui revisão humana |

## Cabeçalho obrigatório

Todo arquivo criado ou editado pelo GOS3 deve começar com o cabeçalho definido em `docs/PLAYBOOK.md`:

```markdown
> **GOS3** · agente: `<nome>` · papel: `<papel>` (ver docs/team.md)
> fase: `<fase do backlog>` · data: `<AAAA-MM-DD>` · hora: `<HH:MM:SS TZ>`
> antes: <estado de 1 linha antes desta mudança>
> depois: <o que esta mudança entrega/altera>
> base: commit `<hash>` (se aplicável)
> assinatura: `<nome do agente> · <papel> · GOS3`
```

Para TypeScript, Python e Shell, use o mesmo conteúdo como comentário. Arquivos JSON devem permanecer JSON válido; nesse caso, registre a mudança neste documento e no commit, sem inserir comentários inválidos.

## Fluxo de mudança

Toda alteração relevante segue a sequência: problema, issue, proposta, teste, execução real, evidência, revisão, aprovação quando necessária, commit e atualização do backlog. Mudanças em contrato de invocação, isolamento, permissões MCP ou execução de comandos não devem ser aprovadas automaticamente.

## Runtime local

No A23, o Ollama deve escutar somente em `127.0.0.1:11434`. O modelo recomendado é `qwen-a23`, derivado de `qwen2.5-coder:0.5b`, com contexto de 1024 tokens e uma requisição por vez. O MCP pode usar stdio para um cliente ou Streamable HTTP local autenticado quando vários agentes precisarem compartilhar o gateway.

O MCP não deve expor a porta do Ollama. O gateway deve manter credenciais de GitHub e S3 no ambiente seguro, aplicar allowlists de comandos Vortex e exigir confirmação para escrita, exclusão ou execução sensível.

## Evidência mínima

Uma execução real deve registrar `exit_code`, `stdout_raw`, `stderr`, `duration_ms`, `runtime_id` e `output_hash` SHA-256. Se o runtime não foi executado, o resultado deve declarar `executed: false` ou `claim: "not_executed"`. Respostas do Qwen não são evidência de que uma operação externa foi executada.

## Checklist de entrada

O operador deve confirmar que o repositório foi clonado, as dependências foram instaladas, `npm run build:mcp` passa, o Ollama responde em localhost, `OLLAMA_MODEL` aponta para `qwen-a23` e apenas uma instância do MCP está ativa. Antes de habilitar GitHub ou S3, deve definir permissões mínimas e nunca inserir chaves em código, URLs, prompts ou arquivos versionados.

## Registro desta mudança

Este onboarding foi criado sobre o commit `e49ef90`. A implementação do adaptador local está em `src/mcp-server.ts`; a configuração de ambiente está em `.env.example`; e as instruções de execução estão em `README-MCP.md`.
