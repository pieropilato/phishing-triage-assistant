#!/usr/bin/env bash
# Fails if something that looks like a real API key or private key is committed.
set -euo pipefail

PATTERN='(sk-ant-[A-Za-z0-9_-]{20,}|sk-(proj-)?[A-Za-z0-9]{32,}|sk-or-v1-[A-Za-z0-9]{32,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|-----BEGIN [A-Z ]*PRIVATE KEY-----)'

if git ls-files -z | grep -zv -e '^package-lock.json$' -e '^scripts/check-secrets.sh$' | xargs -0 grep -nIE "$PATTERN"; then
  echo "Possible secret found in the files above. Remove it and rotate the key."
  exit 1
fi

if git ls-files | grep -E '(^|/)\.env(\.local|\.production)?$'; then
  echo ".env files must not be committed."
  exit 1
fi

echo "No hardcoded secrets found."
