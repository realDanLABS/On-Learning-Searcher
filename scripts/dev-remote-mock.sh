#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_PORT="${REMOTE_MOCK_PORT:-8787}"
APP_PORT="${APP_PORT:-3000}"

cd "$ROOT_DIR"

free_port_if_busy() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    local pids
    pids="$(lsof -ti tcp:"$port" || true)"
    if [[ -n "$pids" ]]; then
      echo "[dev-remote-mock] port ${port} is busy. terminating: ${pids}"
      kill $pids 2>/dev/null || true
      sleep 0.5
    fi
  fi
}

free_port_if_busy "$API_PORT"
free_port_if_busy "$APP_PORT"

node scripts/remote-mock-server.mjs &
MOCK_PID=$!

cleanup() {
  kill "$MOCK_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "[dev-remote-mock] remote mock api: http://localhost:${API_PORT}"
echo "[dev-remote-mock] app dev server: http://localhost:${APP_PORT}"

NEXT_PUBLIC_API_BASE_URL="http://localhost:${API_PORT}" \
npm run dev
