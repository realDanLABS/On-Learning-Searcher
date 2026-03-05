#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_PORT="${REMOTE_MOCK_PORT:-8787}"
APP_PORT="${APP_PORT:-5173}"

cd "$ROOT_DIR"

node scripts/remote-mock-server.mjs &
MOCK_PID=$!

cleanup() {
  kill "$MOCK_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "[dev-remote-mock] remote mock api: http://localhost:${API_PORT}"
echo "[dev-remote-mock] app dev server: http://localhost:${APP_PORT}"

VITE_API_MODE=remote \
VITE_API_BASE_URL="http://localhost:${API_PORT}" \
VITE_SSO_LOGIN_URL="http://localhost:${API_PORT}/auth/callback?status=success&employeeId=E1001&name=Demo%20User&organization=Learning%20Team&role=employee" \
VITE_SSO_LOGOUT_URL="http://localhost:${APP_PORT}" \
VITE_SSO_CALLBACK_URL="/auth/callback" \
VITE_ECAMPUS_COURSE_APPLY_URL="http://localhost:${API_PORT}/ecampus/apply" \
npm run dev -- --port "${APP_PORT}"
