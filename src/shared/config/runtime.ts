export type ApiMode = 'mock' | 'remote'
export type FeatureKey =
  | 'diagnosis'
  | 'recommendation'
  | 'course-linking'
  | 'history'
  | 'chatbot'
  | 'responsive'

export const runtimeConfig = {
  apiMode: (import.meta.env.VITE_API_MODE as ApiMode | undefined) || 'mock',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  ssoLoginUrl: import.meta.env.VITE_SSO_LOGIN_URL || '',
  ssoLogoutUrl: import.meta.env.VITE_SSO_LOGOUT_URL || '',
  ssoCallbackUrl: import.meta.env.VITE_SSO_CALLBACK_URL || '/auth/callback',
  ecampusCourseApplyUrl: import.meta.env.VITE_ECAMPUS_COURSE_APPLY_URL || 'https://example.com',
  disabledFeatures: parseDisabledFeatures(import.meta.env.VITE_DISABLED_FEATURES || ''),
  apiRetryCount: Number(import.meta.env.VITE_API_RETRY_COUNT || '1'),
  errorReportUrl: import.meta.env.VITE_ERROR_REPORT_URL || '',
  debugTools: import.meta.env.VITE_DEBUG_TOOLS === '1',
}

function parseDisabledFeatures(raw: string): FeatureKey[] {
  return raw
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token): token is FeatureKey =>
      ['diagnosis', 'recommendation', 'course-linking', 'history', 'chatbot', 'responsive'].includes(token),
    )
}
