#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

echo "[release-check] 1/5 lint"
npm run lint

echo "[release-check] 2/5 unit/integration test"
npm run test

echo "[release-check] 3/5 e2e test"
npm run test:e2e

echo "[release-check] 4/5 production build"
npm run build

echo "[release-check] 5/5 worktree status snapshot"
bash scripts/worktree-status.sh

echo
echo "[release-check] all checks passed"
