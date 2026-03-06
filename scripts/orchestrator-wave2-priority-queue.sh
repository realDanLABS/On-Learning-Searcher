#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MERGE_FILE="$ROOT_DIR/ORCHESTRATION/WAVE2_MERGE_READINESS.md"
CHECKIN_FILE="$ROOT_DIR/ORCHESTRATION/WAVE2_CHECKIN_SUMMARY.md"
STALE_FILE="$ROOT_DIR/ORCHESTRATION/WAVE2_STALE_CHECKINS.md"
OUT_FILE="$ROOT_DIR/ORCHESTRATION/WAVE2_PRIORITY_QUEUE.md"

cd "$ROOT_DIR"

[[ -f "$MERGE_FILE" ]] || bash scripts/orchestrator-wave2-merge-readiness.sh >/tmp/w2_pq_merge.log 2>&1 || true
[[ -f "$CHECKIN_FILE" ]] || bash scripts/orchestrator-wave2-checkin-summary.sh >/tmp/w2_pq_checkin.log 2>&1 || true
[[ -f "$STALE_FILE" ]] || bash scripts/orchestrator-wave2-stale-checkins.sh >/tmp/w2_pq_stale.log 2>&1 || true

generated_at="$(date -u +"%Y-%m-%d %H:%M:%S UTC")"

{
  echo "# Wave2 Priority Queue"
  echo
  echo "- generatedAt: $generated_at"
  echo
  echo "| Rank | Worktree | Reason | Suggested Action |"
  echo "|---:|---|---|---|"
} > "$OUT_FILE"

rank=0

# 1) no-feature-commit in merge order
while IFS=$'\t' read -r wt action; do
  [[ -z "$wt" ]] && continue
  if [[ "$action" == "no feature commits yet" ]]; then
    rank=$((rank + 1))
    echo "| $rank | $wt | 첫 기능 커밋 없음 | 킥스타트 하달 + 첫 커밋 유도 |" >> "$OUT_FILE"
  fi
done < <(
  awk -F'|' '
    /^\| [0-9]+ /{
      wt=$3; action=$10;
      gsub(/^ +| +$/,"",wt);
      gsub(/^ +| +$/,"",action);
      if (wt!="Worktree" && wt!="") print wt "\t" action
    }
  ' "$MERGE_FILE"
)

# 2) blocked items
while IFS=$'\t' read -r wt status blocker; do
  [[ -z "$wt" ]] && continue
  if [[ "$status" == "BLOCKED" || "$blocker" == "yes" ]]; then
    rank=$((rank + 1))
    echo "| $rank | $wt | blocker 감지 | blocker 해소 지원 요청 |" >> "$OUT_FILE"
  fi
done < <(
  awk -F'|' '
    /^\| [a-z-]+ /{
      wt=$2; status=$4; blocker=$5;
      gsub(/^ +| +$/,"",wt);
      gsub(/^ +| +$/,"",status);
      gsub(/^ +| +$/,"",blocker);
      if (wt!="Worktree" && wt!="") print wt "\t" status "\t" blocker
    }
  ' "$CHECKIN_FILE"
)

# 3) stale items
while IFS=$'\t' read -r wt stale; do
  [[ -z "$wt" ]] && continue
  if [[ "$stale" == "YES" ]]; then
    rank=$((rank + 1))
    echo "| $rank | $wt | 체크인 지연 | 체크인 최신화 요청 |" >> "$OUT_FILE"
  fi
done < <(
  awk -F'|' '
    /^\| [a-z-]+ /{
      wt=$2; stale=$4;
      gsub(/^ +| +$/,"",wt);
      gsub(/^ +| +$/,"",stale);
      if (wt!="Worktree" && wt!="") print wt "\t" stale
    }
  ' "$STALE_FILE"
)

if [[ "$rank" -eq 0 ]]; then
  echo "| 1 | - | 우선순위 항목 없음 | merge candidate 정리 |" >> "$OUT_FILE"
fi

echo "generated: $OUT_FILE"
