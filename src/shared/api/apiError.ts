export type ApiErrorCode =
  | 'unauthorized'
  | 'forbidden'
  | 'timeout'
  | 'network'
  | 'server'
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

