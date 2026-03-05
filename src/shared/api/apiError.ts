export type ApiErrorCode =
  | 'bad_request'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'timeout'
  | 'network'
  | 'server'
  | 'invalid_payload'
  | 'misconfigured'
  | 'service_unavailable'
  | 'unknown'

export class ApiError extends Error {
  code: ApiErrorCode
  status?: number

  constructor(code: ApiErrorCode, message: string, status?: number) {
    super(message)
    this.code = code
    this.status = status
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (error instanceof Error) return new ApiError('unknown', error.message)
  return new ApiError('unknown', '알 수 없는 오류가 발생했습니다.')
}

export function toApiErrorFromStatus(status: number, fallbackMessage: string): ApiError {
  if (status === 400 || status === 422) return new ApiError('bad_request', fallbackMessage, status)
  if (status === 401) return new ApiError('unauthorized', fallbackMessage, status)
  if (status === 403) return new ApiError('forbidden', fallbackMessage, status)
  if (status === 404) return new ApiError('not_found', fallbackMessage, status)
  if (status === 409) return new ApiError('conflict', fallbackMessage, status)
  if (status >= 500) return new ApiError('server', fallbackMessage, status)
  return new ApiError('unknown', fallbackMessage, status)
}
