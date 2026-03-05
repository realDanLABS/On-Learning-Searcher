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
  traceId?: string
  backendCode?: string

  constructor(
    code: ApiErrorCode,
    message: string,
    status?: number,
    meta?: { traceId?: string; backendCode?: string },
  ) {
    super(message)
    this.code = code
    this.status = status
    this.traceId = meta?.traceId
    this.backendCode = meta?.backendCode
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (error instanceof Error) return new ApiError('unknown', error.message)
  return new ApiError('unknown', '알 수 없는 오류가 발생했습니다.')
}

export function toApiErrorFromStatus(status: number, fallbackMessage: string): ApiError {
  return buildApiErrorFromHttp(status, fallbackMessage)
}

type BackendErrorPayload = {
  code?: string
  message?: string
  traceId?: string
}

export async function toApiErrorFromResponse(
  response: Response,
  fallbackMessage: string,
): Promise<ApiError> {
  const traceId = response.headers.get('x-trace-id') || undefined
  const payload = await readBackendErrorPayload(response)
  return buildApiErrorFromHttp(response.status, fallbackMessage, payload, traceId)
}

export function buildApiErrorFromHttp(
  status: number,
  fallbackMessage: string,
  payload?: BackendErrorPayload,
  traceIdHeader?: string,
): ApiError {
  const code = mapBackendCode(payload?.code) ?? mapStatusCode(status)
  const message = payload?.message || fallbackMessage
  const traceId = payload?.traceId || traceIdHeader
  return new ApiError(code, message, status, {
    traceId,
    backendCode: payload?.code,
  })
}

function mapStatusCode(status: number): ApiErrorCode {
  if (status === 400 || status === 422) return 'bad_request'
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not_found'
  if (status === 409) return 'conflict'
  if (status >= 500) return 'server'
  return 'unknown'
}

function mapBackendCode(code: string | undefined): ApiErrorCode | null {
  if (!code) return null
  if (code === 'BAD_REQUEST') return 'bad_request'
  if (code === 'UNAUTHORIZED') return 'unauthorized'
  if (code === 'FORBIDDEN') return 'forbidden'
  if (code === 'NOT_FOUND') return 'not_found'
  if (code === 'CONFLICT') return 'conflict'
  if (code === 'TIMEOUT') return 'timeout'
  if (code === 'NETWORK') return 'network'
  if (code === 'SERVER') return 'server'
  if (code === 'INVALID_PAYLOAD') return 'invalid_payload'
  if (code === 'MISCONFIGURED') return 'misconfigured'
  if (code === 'SERVICE_UNAVAILABLE') return 'service_unavailable'
  if (code === 'UNKNOWN') return 'unknown'
  return null
}

async function readBackendErrorPayload(response: Response): Promise<BackendErrorPayload | undefined> {
  try {
    const data = (await response.clone().json()) as
      | BackendErrorPayload
      | { error?: BackendErrorPayload }
      | undefined
    if (!data || typeof data !== 'object') return undefined
    if ('error' in data && data.error && typeof data.error === 'object') {
      return data.error
    }
    return data as BackendErrorPayload
  } catch {
    return undefined
  }
}
