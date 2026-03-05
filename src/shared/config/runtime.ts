export type ApiMode = 'mock' | 'remote'

export const runtimeConfig = {
  apiMode: (import.meta.env.VITE_API_MODE as ApiMode | undefined) || 'mock',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  ecampusCourseApplyUrl: import.meta.env.VITE_ECAMPUS_COURSE_APPLY_URL || 'https://example.com',
}

