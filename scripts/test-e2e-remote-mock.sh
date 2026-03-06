#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_PORT="${REMOTE_MOCK_PORT:-8787}"
APP_PORT="${APP_PORT:-4173}"
API_BASE_URL="http://127.0.0.1:${API_PORT}"
APP_BASE_URL="http://127.0.0.1:${APP_PORT}"

cd "$ROOT_DIR"

free_port_if_busy() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    local pids
    pids="$(lsof -ti tcp:"$port" || true)"
    if [[ -n "$pids" ]]; then
      echo "[test:e2e:remote] port ${port} is busy. terminating: ${pids}"
      kill $pids 2>/dev/null || true
      sleep 0.5
    fi
  fi
}

wait_for_url() {
  local url="$1"
  local name="$2"
  local retries="${3:-60}"
  local delay="${4:-0.5}"

  for _ in $(seq 1 "$retries"); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep "$delay"
  done

  echo "[test:e2e:remote] timeout waiting for ${name}: ${url}"
  return 1
}

free_port_if_busy "$API_PORT"
free_port_if_busy "$APP_PORT"

node scripts/remote-mock-server.mjs > /tmp/on-learning-remote-mock.log 2>&1 &
API_PID=$!

VITE_API_MODE=remote \
VITE_API_BASE_URL="$API_BASE_URL" \
VITE_SSO_LOGIN_URL="$APP_BASE_URL/auth/callback?status=success&employeeId=E1001&name=Demo%20User&organization=Learning%20Team&role=employee" \
VITE_SSO_LOGOUT_URL="$APP_BASE_URL" \
VITE_SSO_CALLBACK_URL="/auth/callback" \
VITE_ECAMPUS_COURSE_APPLY_URL="$API_BASE_URL/ecampus/apply" \
npm run dev -- --host 127.0.0.1 --port "$APP_PORT" > /tmp/on-learning-remote-app.log 2>&1 &
APP_PID=$!

cleanup() {
  kill "$APP_PID" 2>/dev/null || true
  kill "$API_PID" 2>/dev/null || true
  wait "$APP_PID" 2>/dev/null || true
  wait "$API_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

wait_for_url "$API_BASE_URL/health" "remote mock api"
wait_for_url "$APP_BASE_URL" "app dev server"

echo "[test:e2e:remote] running playwright against ${APP_BASE_URL}"
PLAYWRIGHT_TEST_BASE_URL="$APP_BASE_URL" npx playwright test e2e/remote-smoke.spec.ts

echo "[test:e2e:remote] passed"
