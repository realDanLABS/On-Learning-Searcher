#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MERGE_FILE="$ROOT_DIR/ORCHESTRATION/WAVE2_MERGE_READINESS.md"
OUT_FILE="$ROOT_DIR/ORCHESTRATION/WAVE2_MERGE_PLAN.md"

cd "$ROOT_DIR"

if [[ ! -f "$MERGE_FILE" ]]; then
  bash scripts/orchestrator-wave2-merge-readiness.sh >/tmp/w2_merge_plan.log 2>&1 || true
fi

generated_at="$(date -u +"%Y-%m-%d %H:%M:%S UTC")"

{
  echo "# Wave2 Merge Plan"
  echo
  echo "- generatedAt: $generated_at"
  echo
  echo "## Ready Candidates"
  echo
  echo "| Order | Worktree | Branch | Reason |"
  echo "|---:|---|---|---|"
} > "$OUT_FILE"

ready_count=0
while IFS=$'\t' read -r order wt branch ready action; do
  if [[ "$ready" == "YES" ]]; then
    ready_count=$((ready_count + 1))
    echo "| $order | $wt | $branch | $action |" >> "$OUT_FILE"
  fi
done < <(
  awk -F'|' '
    /^\| [0-9]+ /{
      order=$2; wt=$3; branch=$4; ready=$9; action=$10;
      gsub(/^ +| +$/,"",order);
      gsub(/^ +| +$/,"",wt);
      gsub(/^ +| +$/,"",branch);
      gsub(/^ +| +$/,"",ready);
      gsub(/^ +| +$/,"",action);
      print order "\t" wt "\t" branch "\t" ready "\t" action
    }
  ' "$MERGE_FILE"
)

{
  echo
  echo "## Merge Commands"
  echo
  if [[ "$ready_count" -eq 0 ]]; then
    echo "- 현재 merge-ready 후보가 없습니다."
    echo "- 우선 \`first feature commit\` 생성 후 체크인/게이트를 갱신하세요."
  else
    echo '```bash'
    echo "cd \"$ROOT_DIR\""
    while IFS=$'\t' read -r order wt branch ready action; do
      if [[ "$ready" == "YES" ]]; then
        echo "# $order) $wt ($branch)"
        echo "git merge --ff-only $branch"
      fi
    done < <(
      awk -F'|' '
        /^\| [0-9]+ /{
          order=$2; wt=$3; branch=$4; ready=$9; action=$10;
          gsub(/^ +| +$/,"",order);
          gsub(/^ +| +$/,"",wt);
          gsub(/^ +| +$/,"",branch);
          gsub(/^ +| +$/,"",ready);
          gsub(/^ +| +$/,"",action);
          print order "\t" wt "\t" branch "\t" ready "\t" action
        }
      ' "$MERGE_FILE"
    )
    echo "bash scripts/orchestrator-wave2-command-center.sh full"
    echo '```'
  fi
} >> "$OUT_FILE"

echo "generated: $OUT_FILE"
