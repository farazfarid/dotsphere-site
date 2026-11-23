#!/bin/bash
# Commit → GitHub (farazfarid/dotsphere-site) → Coolify rebuild (apps server 169.58.117.132).
# Die Coolify-API ist von außen zu: Aufruf per SSH auf dem Server, Token aus ~/.config/luminax/coolify-token.
set -e
cd "$(dirname "$0")/.."
node scripts/verify.mjs
APP_UUID="$(cat .coolify-app 2>/dev/null || true)"
MSG="${*:-Update $(date '+%Y-%m-%d %H:%M')}"
if [[ -n "$(git status --porcelain)" ]]; then
  git add -A
  git commit -m "$MSG"
fi
git push origin main
[[ -z "$APP_UUID" ]] && { echo "Keine Coolify-App-ID in .coolify-app"; exit 1; }
ssh -o BatchMode=yes root@169.58.117.132 "read T; curl -s -X POST -H \"Authorization: Bearer \$T\" 'http://localhost:8000/api/v1/deploy?uuid=$APP_UUID&force=false'" < ~/.config/luminax/coolify-token
echo
echo "Deploy gestartet: https://dotsphere.farazfarid.com"
