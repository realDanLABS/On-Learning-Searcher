#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher"
FILE="$ROOT/ORCHESTRATION/WAVE2_KICKSTART_TASKS.md"

if [[ ! -f "$FILE" ]]; then
  echo "킥스타트 파일이 없습니다: $FILE"
  echo "먼저 실행: bash scripts/orchestrator-wave2-kickstart.sh"
  exit 1
fi

for i in 1 2 3 4 5 6 7; do
  awk -v i="$i" '
    $0 ~ "^## " i "\\) " {on=1; next}
    on && $0 ~ "^## [0-9]+\\) " {exit}
    on {print}
  ' "$FILE" | pbcopy

  echo "[$i/7] 킥스타트 클립보드 복사 완료: 하위 스레드에 붙여넣고 Enter 후, 터미널에서 Enter"
  read -r
done

echo "Wave2 킥스타트 7개 전송 루프 완료"
