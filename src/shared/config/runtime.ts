export type ApiMode = 'mock' | 'remote'

export const runtimeConfig = {
  apiMode: (import.meta.env.VITE_API_MODE as ApiMode | undefined) || 'mock',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  ssoLoginUrl: import.meta.env.VITE_SSO_LOGIN_URL || '',
  ssoLogoutUrl: import.meta.env.VITE_SSO_LOGOUT_URL || '',
  ssoCallbackUrl: import.meta.env.VITE_SSO_CALLBACK_URL || '/auth/callback',
  ecampusCourseApplyUrl: import.meta.env.VITE_ECAMPUS_COURSE_APPLY_URL || 'https://example.com',
}
