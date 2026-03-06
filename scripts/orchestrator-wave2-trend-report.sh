#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SNAP_ROOT="$ROOT_DIR/ORCHESTRATION/SNAPSHOTS"
OUT_FILE="$ROOT_DIR/ORCHESTRATION/WAVE2_TREND_REPORT.md"

cd "$ROOT_DIR"

mkdir -p "$SNAP_ROOT"

latest_two=($(ls -1 "$SNAP_ROOT" 2>/dev/null | sort | tail -n 2))
count="${#latest_two[@]}"

extract_metric() {
  local file="$1"
  local key="$2"
  awk -F': ' -v k="$key" '$0 ~ "^- "k":" {gsub(/%/,"",$2); print $2; exit}' "$file" | tr -d '\r'
}

generated_at="$(date -u +"%Y-%m-%d %H:%M:%S UTC")"

{
  echo "# Wave2 Trend Report"
  echo
  echo "- generatedAt: $generated_at"
  echo
} > "$OUT_FILE"

if [[ "$count" -lt 2 ]]; then
  {
    echo "스냅샷이 2개 미만이라 비교할 수 없습니다."
    echo
    echo "## Next"
    echo "- command-center를 2회 이상 실행해 스냅샷을 누적하세요."
  } >> "$OUT_FILE"
  echo "generated: $OUT_FILE"
  exit 0
fi

prev="${latest_two[0]}"
curr="${latest_two[1]}"

prev_file="$SNAP_ROOT/$prev/WAVE2_DAILY_BRIEF.md"
curr_file="$SNAP_ROOT/$curr/WAVE2_DAILY_BRIEF.md"

if [[ ! -f "$prev_file" || ! -f "$curr_file" ]]; then
  {
    echo "비교 대상 데일리 브리프 파일이 부족합니다."
    echo "- prev: $prev_file"
    echo "- curr: $curr_file"
  } >> "$OUT_FILE"
  echo "generated: $OUT_FILE"
  exit 0
fi

prev_avg="$(extract_metric "$prev_file" "averageProgress")"
curr_avg="$(extract_metric "$curr_file" "averageProgress")"
prev_ready="$(extract_metric "$prev_file" "mergeReadyCount")"
curr_ready="$(extract_metric "$curr_file" "mergeReadyCount")"
prev_blocked="$(extract_metric "$prev_file" "blockedCount")"
curr_blocked="$(extract_metric "$curr_file" "blockedCount")"
prev_no_commit="$(extract_metric "$prev_file" "noFeatureCommitCount")"
curr_no_commit="$(extract_metric "$curr_file" "noFeatureCommitCount")"

[[ -z "$prev_avg" ]] && prev_avg="0"
[[ -z "$curr_avg" ]] && curr_avg="0"
[[ -z "$prev_ready" ]] && prev_ready="0"
[[ -z "$curr_ready" ]] && curr_ready="0"
[[ -z "$prev_blocked" ]] && prev_blocked="0"
[[ -z "$curr_blocked" ]] && curr_blocked="0"
[[ -z "$prev_no_commit" ]] && prev_no_commit="0"
[[ -z "$curr_no_commit" ]] && curr_no_commit="0"

delta_avg=$((curr_avg - prev_avg))
delta_ready=$((curr_ready - prev_ready))
delta_blocked=$((curr_blocked - prev_blocked))
delta_no_commit=$((curr_no_commit - prev_no_commit))

{
  echo "## Snapshot Window"
  echo
  echo "- previous: $prev"
  echo "- current: $curr"
  echo
  echo "## KPI Delta"
  echo
  echo "| Metric | Previous | Current | Delta |"
  echo "|---|---:|---:|---:|"
  echo "| averageProgress | $prev_avg | $curr_avg | $delta_avg |"
  echo "| mergeReadyCount | $prev_ready | $curr_ready | $delta_ready |"
  echo "| blockedCount | $prev_blocked | $curr_blocked | $delta_blocked |"
  echo "| noFeatureCommitCount | $prev_no_commit | $curr_no_commit | $delta_no_commit |"
  echo
  echo "## Interpretation"
  echo
  if [[ "$delta_avg" -gt 0 || "$delta_ready" -gt 0 || "$delta_no_commit" -lt 0 ]]; then
    echo "- 상태 개선 신호가 있습니다."
  else
    echo "- 의미 있는 개선 신호가 없습니다. 첫 기능 커밋 유도에 집중하세요."
  fi
} >> "$OUT_FILE"

echo "generated: $OUT_FILE"
