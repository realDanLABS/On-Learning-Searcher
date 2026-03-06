#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MERGE_FILE="$ROOT_DIR/ORCHESTRATION/WAVE2_MERGE_READINESS.md"
OUT_FILE="$ROOT_DIR/ORCHESTRATION/WAVE2_KICKSTART_TASKS.md"

WORKTREES=(
  "foundation"
  "diagnosis"
  "recommendation"
  "course-linking"
  "history"
  "chatbot"
  "responsive"
)

goal_for() {
  case "$1" in
    foundation) echo "공통 상태 컴포넌트 + 릴리즈 메타 표기" ;;
    diagnosis) echo "문항 확장 + 이탈 이벤트 계측" ;;
    recommendation) echo "추천 근거 모달 + 즐겨찾기/보류" ;;
    course-linking) echo "신청 실패 재시도 + 콜백 검증 강화" ;;
    history) echo "벤치마크 위젯 + 월간 리포트 다운로드" ;;
    chatbot) echo "컨텍스트 상담 + 종료 후 다음액션" ;;
    responsive) echo "접근성 QA + 모바일 UX 보강" ;;
    *) echo "Wave2 목표" ;;
  esac
}

cd "$ROOT_DIR"

if [[ ! -f "$MERGE_FILE" ]]; then
  bash scripts/orchestrator-wave2-merge-readiness.sh >/tmp/w2_kick_merge.log 2>&1 || true
fi

generated_at="$(date -u +"%Y-%m-%d %H:%M:%S UTC")"

{
  echo "# Wave2 Kickstart Tasks"
  echo
  echo "- generatedAt: $generated_at"
  echo
  echo "아래 항목은 '첫 기능 커밋 없음' 워크트리 우선 착수용."
} > "$OUT_FILE"

i=0
for name in "${WORKTREES[@]}"; do
  action="$(awk -F'|' -v n="$name" '/^\| [0-9]+ / {gsub(/^ +| +$/,"",$3); gsub(/^ +| +$/,"",$10); if($3==n) {print $10; exit}}' "$MERGE_FILE" || true)"
  [[ -z "$action" ]] && action="unknown"

  if [[ "$action" != "no feature commits yet" ]]; then
    continue
  fi

  i=$((i + 1))
  goal="$(goal_for "$name")"

  {
    echo
    echo "## $i) $name"
    echo
    echo "- 목표: $goal"
    echo "- 작업 경로: /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/$name"
    echo "- 권장 시작 명령:"
    echo '```bash'
    echo "cd \"/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/$name\""
    echo "git status --short --branch"
    echo "# 기능 구현 후"
    echo "npm run lint && npm run test"
    echo '```'
    echo "- 완료조건: 첫 기능 커밋 1개 이상 + 체크인 progress 20% 이상"
    echo "- 권장 커밋메시지: \`feat($name): start wave2 $name implementation\`"
    echo "- 완료 후 오케스트레이터 명령:"
    echo '```bash'
    echo "cd \"/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher\""
    echo "bash scripts/orchestrator-wave2-checkin-update.sh $name 20 IN_PROGRESS 없음"
    echo "bash scripts/orchestrator-wave2-command-center.sh quick"
    echo '```'
  } >> "$OUT_FILE"
done

if [[ "$i" -eq 0 ]]; then
  {
    echo
    echo "## 안내"
    echo
    echo "- no feature commits yet 항목이 없습니다."
    echo "- 머지 준비 후보 또는 blocker 해소 중심으로 진행하세요."
  } >> "$OUT_FILE"
fi

echo "generated: $OUT_FILE"
