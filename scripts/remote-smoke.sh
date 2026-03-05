#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[remote-smoke] .env 파일이 없습니다: $ENV_FILE"
  echo "[remote-smoke] .env.example 을 복사해 운영 값으로 채운 뒤 다시 실행하세요."
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

echo "[remote-smoke] 환경 검증 시작"

if [[ "${VITE_API_MODE:-}" != "remote" ]]; then
  echo "[remote-smoke] VITE_API_MODE=remote 가 아닙니다."
  exit 1
fi

required_vars=(
  "VITE_API_BASE_URL"
  "VITE_SSO_LOGIN_URL"
  "VITE_SSO_LOGOUT_URL"
  "VITE_ECAMPUS_COURSE_APPLY_URL"
)

for key in "${required_vars[@]}"; do
  value="${!key:-}"
  if [[ -z "$value" ]]; then
    echo "[remote-smoke] 필수 값 누락: $key"
    exit 1
  fi
  if [[ "$value" == *"example.com"* ]]; then
    echo "[remote-smoke] 샘플 도메인 사용 중: $key=$value"
    exit 1
  fi
done

if [[ ! "${VITE_API_BASE_URL}" =~ ^https?:// ]]; then
  echo "[remote-smoke] VITE_API_BASE_URL 형식 오류: ${VITE_API_BASE_URL}"
  exit 1
fi

HEALTH_URL="${VITE_API_BASE_URL%/}/health"
echo "[remote-smoke] API health 체크: ${HEALTH_URL}"

http_code="$(curl -sS -o /tmp/on_learning_remote_health.out -w "%{http_code}" \
  --connect-timeout 5 --max-time 10 "$HEALTH_URL" || true)"

if [[ "$http_code" != "200" ]]; then
  echo "[remote-smoke] health 체크 실패 (HTTP $http_code)"
  echo "[remote-smoke] 응답:"
  cat /tmp/on_learning_remote_health.out || true
  exit 1
fi

echo "[remote-smoke] health 체크 성공 (HTTP 200)"
echo "[remote-smoke] 원격 운영 스모크 통과"
