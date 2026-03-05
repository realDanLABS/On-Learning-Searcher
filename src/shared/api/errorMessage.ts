import { toApiError } from './apiError'

const messageByCode = {
  bad_request: '요청 값이 올바르지 않습니다. 입력 내용을 확인해 주세요.',
  unauthorized: '인증이 만료되었습니다. 다시 로그인 후 시도해 주세요.',
  forbidden: '현재 계정 권한으로는 이 작업을 수행할 수 없습니다.',
  not_found: '요청한 대상을 찾을 수 없습니다.',
  conflict: '동일한 요청이 이미 처리되었습니다. 최신 상태를 확인해 주세요.',
  timeout: '요청 시간이 초과되었습니다. 네트워크 상태를 확인해 주세요.',
  network: '네트워크 연결 상태를 확인해 주세요.',
  server: '서버 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  invalid_payload: '서버 응답 형식이 올바르지 않습니다. 관리자에게 문의해 주세요.',
  misconfigured: '운영 설정이 올바르지 않습니다. 관리자에게 문의해 주세요.',
  service_unavailable: '서비스가 일시적으로 불안정합니다. 잠시 후 다시 시도해 주세요.',
  unknown: '요청 처리 중 오류가 발생했습니다. 다시 시도해 주세요.',
} as const

export function getErrorMessage(error: unknown, fallback = '오류가 발생했습니다. 다시 시도해 주세요.') {
  const normalized = toApiError(error)
  return messageByCode[normalized.code] ?? fallback
}
