# Vortex GOS3 Runtime

## Objetivo

Este módulo fornece um núcleo de execução orientado a evidências para LLMs. Ele opera em dois modos explícitos:

| Modo | Requisito | Capacidades | Limite |
|---|---|---|---|
| `local-no-connector` | Apenas checkout local | Identifica o repositório, lê onboarding/política, calcula evidência e grava memória hash-chain | Não acessa GitHub nem escreve remotamente |
| `github` | `GITHUB_TOKEN` + `--github-repo owner/name` | Mantém as provas locais e habilita leitura/escrita explícita pela API do GitHub | Não assina commits automaticamente; escrita requer `--allow-write` |

A ausência do conector não é convertida em sucesso de integração. Ela aparece como `CONNECTOR_PRESENT: not_applicable`, enquanto o gate local continua exigindo apenas provas que podem ser produzidas localmente.

## Contrato de prova

O runtime separa os seguintes conceitos:

```text
connector_write != git_signed_commit != execution_evidence
```

`write_executed` somente pode ser verdadeiro após uma resposta bem-sucedida da operação de escrita. `commit_sha` vem da resposta do GitHub. `git_signed_commit` permanece falso e `signature_status` permanece `not_verified` porque a API de conteúdo não fornece, por si só, uma chave de assinatura do committer.

A evidência de execução é canonicalizada em JSON e recebe SHA-256. A memória usa uma cadeia de hashes: cada evento aponta para o hash do evento anterior, permitindo detectar alteração posterior.

## Uso sem conector

```bash
python3 src/vortex_gos3.py /caminho/para/vortex \
  --task 'auditar contrato local' \
  --memory .vortex/memory.jsonl
```

Esse modo é apropriado para LLMs que receberam apenas um diretório local. Ele não deve afirmar que leu GitHub, abriu PR, executou CI ou escreveu no remoto.

## Uso com conector

```bash
export GITHUB_TOKEN='valor fornecido pelo ambiente seguro'
python3 src/vortex_gos3.py /caminho/para/vortex \
  --github-repo scoobiii/vortex \
  --task 'ler estado do repositório' \
  --memory .vortex/memory.jsonl
```

O modo acima configura o conector, mas não escreve. A escrita é uma operação separada e explicitamente opt-in:

```bash
python3 src/vortex_gos3.py /caminho/para/vortex \
  --github-repo scoobiii/vortex \
  --allow-write \
  --task 'operação de escrita previamente aprovada'
```

O CLI não implementa push Git local, merge, configuração de branch protection ou assinatura de commit. Essas operações devem possuir políticas e gates próprios. Nenhum token deve ser colocado em argumentos, arquivos versionados ou logs.

## Registry e agentes imperativos

O manifesto `src/agents_manifest.json` define agentes e capacidades sem hardcode no orquestrador. `grok` e `grok-bot` permanecem ativos; `xai`, `zai` e `yai` estão registrados como implementadores prontos; Gemini, Claude e GPT permanecem reviewers silenciosos. Um agente silencioso pode revisar evidência, mas não pode criar plano imperativo.

O dispatcher retorna um plano auditável. `claim: planned` não significa que a ação foi executada. Escrita remota só pode ocorrer com connector proof e opt-in explícito.

## Auto-orquestração

A auto-orquestração atual é determinística e limitada ao pipeline abaixo:

```text
identificar repo → ler onboarding → ler política → coletar snapshot → produzir findings → calcular evidence_hash → persistir evento na memória
```

Ela não inventa agentes, não converte texto de LLM em prova de execução e não executa testes do projeto-alvo silenciosamente. A próxima evolução deve adicionar etapas de runtime real com `stdout`, `stderr`, `exit_code`, duração e `runtime_id`.

## Critérios de aceite

1. O modo sem conector executa sem credenciais e sem chamadas externas.
2. O conector GitHub não pode escrever por padrão.
3. Uma escrita nunca retorna `git_signed_commit: true` sem verificação criptográfica real.
4. A memória detecta adulteração da cadeia.
5. O `evidence_hash` é derivado de uma representação canonicalizada.
6. O checkout-alvo não é alterado pelo modo de auditoria.
7. O relatório diferencia claramente `PASS` de certificação do produto: o gate valida apenas as provas cobertas pelo contrato implementado.

## CI

O workflow `.github/workflows/gos3-vortex-runtime.yml` executa compilação, os sete testes do runtime multiagente e o contrato nativo em pull requests e pushes para `main`. Ele usa apenas `contents: read`.

## Estado desta implementação

A implementação é um primeiro núcleo executável. Ela já cobre conector explícito, fallback local, memória verificável e orquestração básica. Ainda não cobre assinatura de commits, CI remoto, execução de sandbox, revisão humana ou um sistema de plugins para múltiplos agentes.
