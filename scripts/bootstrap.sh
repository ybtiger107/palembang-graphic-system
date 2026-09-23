#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -d .git ]]; then
  echo "Git repository already exists at: $ROOT"
  exit 0
fi

python3 scripts/verify.py

git init -b main
git add .
git commit -m "Establish Palembang graphic system source"

cat <<'MSG'

Local repository initialized and committed on branch 'main'.
Nothing was pushed and no remote was created.

Before publishing:
  1. Review LICENSE.md and the visual-rights status.
  2. Review `git status` and `git show --stat`.
  3. Create the intended public GitHub repository.
  4. Add the exact remote URL.
  5. Push only after explicitly confirming that destination and branch.
MSG
