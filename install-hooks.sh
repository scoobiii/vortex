#!/usr/bin/env bash
#
# Data:            2026-09-05
# Diretório:       install-hooks.sh
# Responsabilidade: Instalar o pre-commit hook de governança de cabeçalho,
#                   apontando git config core.hooksPath para .githooks e
#                   garantindo permissão de execução nos scripts envolvidos.
# Versão:          1.0.0
# Assinatura:      vortex <sobrinhosj@gmail.com>

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"

chmod +x "$REPO_ROOT/.githooks/pre-commit"
chmod +x "$REPO_ROOT/scripts/lint/check_header.js"

git config core.hooksPath .githooks

echo "Hook instalado: git config core.hooksPath -> .githooks"
echo "A partir de agora, todo commit valida o cabeçalho dos arquivos staged."
