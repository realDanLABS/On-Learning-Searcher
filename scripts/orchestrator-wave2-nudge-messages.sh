#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHECKIN_DIR="$ROOT_DIR/ORCHESTRATION/CHECKINS"
OUT_FILE="$ROOT_DIR/ORCHESTRATION/WAVE2_NUDGE_MESSAGES.md"

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

generated_at="$(date -u +"%Y-%m-%d %H:%M:%S UTC")"

{
  echo "# Wave2 Nudge Messages"
  echo
  echo "- generatedAt: $generated_at"
  echo
  echo "아래 메시지를 각 워크트리 스레드에 복붙해서 리마인드 하달."
} > "$OUT_FILE"

for name in "${WORKTREES[@]}"; do
  branch="codex/$name"
  ahead="$(git rev-list --count main.."$branch")"
  behind="$(git rev-list --count "$branch"..main)"
  wt="$ROOT_DIR/worktrees/$name"
  dirty="NO"
  [[ -n "$(git -C "$wt" status --porcelain)" ]] && dirty="YES"

  file="$CHECKIN_DIR/$name.md"
  progress="0"
  status="IN_PROGRESS"
  blocker="없음"
  if [[ -f "$file" ]]; then
    progress="$(awk -F': ' '/^- progress:/ {print $2; exit}' "$file" | tr -d '\r' || true)"
    status="$(awk -F': ' '/^- status:/ {print $2; exit}' "$file" | tr -d '\r' || true)"
    blocker="$(awk 'found && /^  - / {sub(/^  - /,""); print; exit} /^- blockers:/{found=1}' "$file" | tr -d '\r' || true)"
    [[ -z "$progress" ]] && progress="0"
    [[ -z "$status" ]] && status="IN_PROGRESS"
    [[ -z "$blocker" ]] && blocker="없음"
  fi

  goal="$(goal_for "$name")"

  message_type="kickoff"
  if [[ "$status" == "BLOCKED" || "$blocker" != "없음" ]]; then
    message_type="blocked"
  elif [[ "$status" == "DONE" && "$ahead" -gt 0 && "$behind" -eq 0 && "$dirty" == "NO" ]]; then
    message_type="merge_ready"
  elif [[ "$status" == "DONE" && "$ahead" -eq 0 ]]; then
    message_type="done_no_commit"
  elif [[ "$ahead" -gt 0 ]]; then
    message_type="in_progress_with_commits"
  fi

  {
    echo
    echo "## $name"
    echo
    case "$message_type" in
      blocked)
        echo "[오케스트레이터 리마인드] $name"
        echo "- 현재 BLOCKED 상태로 확인됨 (blocker: $blocker)"
        echo "- blocker 해소 경로/필요 지원을 3줄로 회신 요청"
        echo "- blocker 해소 후 체크인 갱신: progress/status/validation 포함"
        ;;
      merge_ready)
        echo "[오케스트레이터 리마인드] $name"
        echo "- 머지 준비 완료로 확인됨 (ahead=$ahead, behind=$behind, dirty=$dirty)"
        echo "- 최종 변경 요약 + 테스트 증빙과 함께 merge candidate로 회신 요청"
        echo "- 목표: $goal"
        ;;
      done_no_commit)
        echo "[오케스트레이터 리마인드] $name"
        echo "- 체크인은 DONE인데 feature 커밋(ahead)이 없음"
        echo "- 커밋 누락 여부 확인 후 체크인/브랜치 상태 정합성 맞춰 회신 요청"
        echo "- 목표: $goal"
        ;;
      in_progress_with_commits)
        echo "[오케스트레이터 리마인드] $name"
        echo "- 진행중 커밋 감지됨 (ahead=$ahead). 체크인 최신화 요청"
        echo "- progress/status/validation을 업데이트하고, blocker 유무를 명시"
        echo "- 목표: $goal"
        ;;
      *)
        echo "[오케스트레이터 리마인드] $name"
        echo "- 아직 feature 커밋이 없음(ahead=0). Wave2 작업 착수 요청"
        echo "- 오늘 목표: $goal"
        echo "- 회신포맷: 진행률/완료/진행중/리스크/다음커밋/검증"
        ;;
    esac
    echo "- 상태스냅샷: progress=$progress, status=$status, blocker=$blocker, ahead=$ahead, behind=$behind, dirty=$dirty"
  } >> "$OUT_FILE"
done

echo "generated: $OUT_FILE"
