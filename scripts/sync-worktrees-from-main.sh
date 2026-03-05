#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE_BRANCH="${1:-main}"

cd "$ROOT_DIR"

current_branch="$(git branch --show-current)"
if [[ "$current_branch" != "$BASE_BRANCH" ]]; then
  echo "[error] run this script on '$BASE_BRANCH' in root worktree. current: $current_branch"
  exit 1
fi

# Keep base branch up-to-date first (safe no-op if no remote change)
git pull --ff-only || true

echo "[sync] base branch: $BASE_BRANCH"

git worktree list --porcelain | awk '/^worktree /{print substr($0,10)}' | while IFS= read -r wt; do
  if [[ "$wt" == "$ROOT_DIR" ]]; then
    continue
  fi

  branch="$(git -C "$wt" branch --show-current)"
  echo
  echo "=== $wt ($branch) ==="

  if [[ -n "$(git -C "$wt" status --porcelain)" ]]; then
    echo "skip: dirty worktree (commit or stash first)"
    continue
  fi

  git -C "$wt" fetch --all --prune
  git -C "$wt" merge --ff-only "$BASE_BRANCH" && echo "ok: fast-forwarded from $BASE_BRANCH" || {
    echo "warn: fast-forward failed. manual rebase needed"
    continue
  }
done
