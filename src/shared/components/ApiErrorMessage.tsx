import { getErrorMessage } from '../api/errorMessage'
import { toApiError } from '../api/apiError'

type ApiErrorMessageProps = {
  error: unknown | null
  fallback?: string
  className?: string
  showTraceId?: boolean
}

export function ApiErrorMessage({
  error,
  fallback = '오류가 발생했습니다. 다시 시도해 주세요.',
  className = 'error-text',
  showTraceId = true,
}: ApiErrorMessageProps) {
  if (!error) return null

  const normalized = toApiError(error)
  const message = typeof error === 'string' ? error : getErrorMessage(error, fallback)

  return (
    <p className={className}>
      {message}
      {showTraceId && normalized.traceId ? ` (문의 코드: ${normalized.traceId})` : ''}
    </p>
  )
}
