#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

echo "[worktree list]"
git worktree list

echo
echo "[per-worktree git status --short --branch]"

git worktree list --porcelain | awk '/^worktree /{print substr($0,10)}' | while IFS= read -r wt; do
  echo
  echo "### $wt"
  git -C "$wt" status --short --branch
  branch="$(git -C "$wt" branch --show-current || true)"
  if [[ -n "$branch" ]]; then
    echo "branch: $branch"
  fi
done
