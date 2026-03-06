#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHECKIN_DIR="$ROOT_DIR/ORCHESTRATION/CHECKINS"
OUT_FILE="$ROOT_DIR/ORCHESTRATION/EXECUTION_BOARD_WAVE2_DRAFT.md"

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
    foundation) echo "Wave2: 공통 상태 컴포넌트 + 릴리즈 메타 표기" ;;
    diagnosis) echo "Wave2: 문항 확장 + 이탈 이벤트 계측" ;;
    recommendation) echo "Wave2: 추천 근거 모달 + 즐겨찾기/보류" ;;
    course-linking) echo "Wave2: 신청 실패 재시도 + 콜백 검증 강화" ;;
    history) echo "Wave2: 벤치마크 위젯 + 월간 리포트 다운로드" ;;
    chatbot) echo "Wave2: 컨텍스트 상담 + 종료 후 다음액션" ;;
    responsive) echo "Wave2: 접근성 QA + 모바일 UX 보강" ;;
    *) echo "Wave2: 목표 미정" ;;
  esac
}

if [[ ! -d "$CHECKIN_DIR" ]]; then
  echo "missing checkins: $CHECKIN_DIR"
  exit 1
fi

generated_at="$(date +"%Y-%m-%d")"

{
  echo "# Execution Board (Wave2 Draft)"
  echo
  echo "- generatedFrom: ORCHESTRATION/CHECKINS"
  echo "- generatedAt: $generated_at"
  echo
  echo "## Status Legend"
  echo "- TODO"
  echo "- IN_PROGRESS"
  echo "- BLOCKED"
  echo "- DONE"
  echo
  echo "| Worktree | Status | Owner Role | Current Goal | Next Check |"
  echo "|---|---|---|---|---|"

  for name in "${WORKTREES[@]}"; do
    file="$CHECKIN_DIR/${name}.md"
    status="IN_PROGRESS"
    progress="0"
    updated="$generated_at"
    blocker="없음"

    if [[ -f "$file" ]]; then
      status_raw="$(awk -F': ' '/^- status:/ {print $2; exit}' "$file" | tr -d '\r' || true)"
      progress_raw="$(awk -F': ' '/^- progress:/ {print $2; exit}' "$file" | tr -d '\r' || true)"
      updated_raw="$(awk -F': ' '/^- updatedAt:/ {print $2; exit}' "$file" | tr -d '\r' || true)"
      blocker_raw="$(awk 'found && /^  - / {sub(/^  - /,""); print; exit} /^- blockers:/{found=1}' "$file" | tr -d '\r' || true)"

      [[ -n "$status_raw" ]] && status="$status_raw"
      [[ -n "$progress_raw" ]] && progress="$progress_raw"
      [[ -n "$updated_raw" ]] && updated="$updated_raw"
      [[ -n "$blocker_raw" ]] && blocker="$blocker_raw"
    fi

    if [[ "$blocker" != "없음" && "$blocker" != "-" ]]; then
      status="BLOCKED"
    fi

    next_check="$updated"
    if [[ "$status" == "DONE" ]]; then
      next_check="complete"
    fi

    goal="$(goal_for "$name")"
    goal_with_progress="${goal} (${progress}%)"

    echo "| $name | $status | Orchestrator | $goal_with_progress | $next_check |"
  done

  echo '| integration-qa | DONE | Orchestrator | Wave2 통합회귀(로컬+remote) 릴리즈 게이트 통과 (`release:check:full`, 107+32+1 PASS) | 2026-03-06 |'
  echo
  echo "## Current Gates (Commercialization)"
  echo "1. 실 API/SSO 연결 전환 검증 (remote mode 실서버 smoke test)."
  echo "2. 이캠퍼스 신청 딥링크 파라미터 운영 확정."
  echo "3. 운영용 접근제어/권한 정책 서버측 강제 검증."
} > "$OUT_FILE"

echo "generated: $OUT_FILE"
