#!/usr/bin/env bash
#
# Data:            2026-09-05
# Diretório:       scripts/governance/enforce_branch_protection.sh
# Responsabilidade: Configurar branch protection no GitHub via `gh` CLI para
#                   que o job "check-headers" (definido em
#                   .github/workflows/header-governance.yml) seja um required
#                   status check — ou seja, PRs não podem ser mergeados na
#                   branch protegida enquanto o gate de cabeçalho não passar.
#                   Isso fecha a brecha que --no-verify e commits feitos pela
#                   UI do GitHub deixam abertas no hook local.
# Versão:          1.0.0
# Assinatura:      vortex <sobrinhosj@gmail.com>
#
# Requer: gh CLI autenticado (gh auth status) com permissão de admin no repo.
# Uso:
#   ./enforce_branch_protection.sh scoobiii/vortex main

set -euo pipefail

REPO="${1:?Uso: $0 <owner/repo> <branch>}"
BRANCH="${2:?Uso: $0 <owner/repo> <branch>}"

echo "Configurando branch protection em $REPO@$BRANCH..."

PAYLOAD=$(cat <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["check-headers"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
)

gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  "repos/$REPO/branches/$BRANCH/protection" \
  --input - <<< "$PAYLOAD"

echo ""
echo "Feito. A partir de agora, PRs para '$BRANCH' só mergeiam se o job"
echo "'check-headers' passar — inclusive para admins (enforce_admins=true)."
echo ""
echo "Verificar:"
echo "  gh api repos/$REPO/branches/$BRANCH/protection | jq '.required_status_checks'"
