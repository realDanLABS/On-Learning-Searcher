#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPORT_FILE="$ROOT_DIR/ORCHESTRATION/WAVE2_STATUS_REPORT.md"

WORKTREES=(
  "foundation"
  "diagnosis"
  "recommendation"
  "course-linking"
  "history"
  "chatbot"
  "responsive"
)

cd "$ROOT_DIR"

now_utc="$(date -u +"%Y-%m-%d %H:%M:%S UTC")"
base_commit="$(git rev-parse --short main)"

{
  echo "# Wave 2 Status Report"
  echo
  echo "- generatedAt: $now_utc"
  echo "- base(main): $base_commit"
  echo
  echo "## Worktree Snapshot"
  echo
  echo "| Worktree | Branch | HEAD | Dirty | Last Commit |"
  echo "|---|---|---|---|---|"

  for name in "${WORKTREES[@]}"; do
    wt="$ROOT_DIR/worktrees/$name"
    branch="$(git -C "$wt" branch --show-current)"
    head="$(git -C "$wt" rev-parse --short HEAD)"

    if [[ -n "$(git -C "$wt" status --porcelain)" ]]; then
      dirty="YES"
    else
      dirty="NO"
    fi

    last_commit="$(git -C "$wt" log --pretty=format:%s -n 1 | tr '|' '/')"
    echo "| $name | $branch | $head | $dirty | $last_commit |"
  done

  echo
  echo "## Check-in Template"
  echo
  echo "각 워크트리 스레드에 아래 포맷으로 회신:"
  echo
  echo '```text'
  echo '[Wave2 체크인] <worktree-name>'
  echo '- 진행률: <0~100>%'
  echo '- 완료: <핵심 1~3개>'
  echo '- 진행중: <현재 작업 1~2개>'
  echo '- 리스크/블로커: <없음 또는 상세>'
  echo '- 다음 커밋 예정: <짧은 메시지>'
  echo '- 검증: <실행 명령 + 결과>'
  echo '```'
  echo
  echo "## Orchestrator Notes"
  echo
  echo "- integration-qa는 모든 워크트리 Wave2 완료 후 실행"
  echo "- dirty=YES 워크트리는 동기화 전에 커밋/정리 필요"
} > "$REPORT_FILE"

echo "generated: $REPORT_FILE"
