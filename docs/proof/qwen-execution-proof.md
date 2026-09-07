> **GOS3** · agente: `GPT` · papel: `Maintainer / Engineering Agent` · fase: `Proof Implementation` · regra: `mexeu, deixa rastro`

# Qwen 0.5B — prova de execução direta vs Vortex

## O que esta prova mede

A CI inicia um `llama-server` local em `127.0.0.1`, carrega uma cópia fixada do `Qwen2.5-Coder-0.5B-Instruct-GGUF` e executa exatamente a mesma requisição:

```text
DIRECT  → localhost:8080/v1/chat/completions
VORTEX  → proof adapter → localhost:8080/v1/chat/completions
```

O pedido usa `temperature=0`, `seed=42` e `max_tokens=96`. O gate exige o mesmo `request_hash` e o mesmo `stdout_hash` nos dois caminhos.

## Evidência obrigatória

Cada execução registra:

- `runtime_id` e arquitetura do runner;
- modelo e versão do `llama.cpp`;
- hash SHA-256 do prompt e da requisição;
- duração real;
- tokens de conclusão e tok/s;
- `executed` e `exit_code`;
- hash da resposta;
- `evidence_hash` do caminho Vortex;
- comparação e overhead em ms e percentual.

`executed=true` só é aceito quando o endpoint local respondeu com sucesso e existe evidência hashável. O teste falha fechado quando a evidência desaparece ou quando os pedidos/saídas divergem.

## Segurança da CI

- somente `push` em `main` e `workflow_dispatch`;
- **não** roda em `pull_request`;
- usa GitHub-hosted runner efêmero, não self-hosted;
- `GITHUB_TOKEN` fica com `contents: read`;
- downloads de `llama.cpp` e do GGUF são fixados por versão/commit e validados por SHA-256;
- servidor do modelo escuta somente `127.0.0.1`;
- nenhum segredo ou conector externo é necessário;
- evidência é armazenada como artifact por 14 dias;
- `proof/results.json` recebe artifact attestation do GitHub Actions.

A escolha de não usar self-hosted runner nesta prova é deliberada: o próprio GitHub alerta que self-hosted runners não oferecem o mesmo isolamento efêmero dos GitHub-hosted runners e podem ser comprometidos por código não confiável. Para medir A23/Termux ou outro hardware específico, o runner deve ser separado e protegido, com execução manual/trusted-only. 

## O que a prova NÃO afirma

Ela não transforma o resultado de um runner GitHub em `100–500+ tok/s` universal. O número de tok/s é válido para o `runtime_id` daquela execução. A comparação de overhead é válida somente para a mesma máquina, modelo, configuração e requisição.

## Saída

A execução publica no Job Summary:

```text
GATE: PASS
Direct:  <tempo> ms / <tokens> tok/s
Vortex:  <tempo> ms / <tokens> tok/s
Overhead: <ms> / <percentual>%
Evidence hash: <sha256>
```

Os artefatos podem ser usados para auditoria posterior; o GitHub também calcula SHA-256 dos artifacts enviados e valida o digest ao baixá-los.
