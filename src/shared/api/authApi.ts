import { runtimeConfig } from '../config/runtime'
import { clearJourneyData } from '../state/learningFlow'
import { clearUserProfile, saveUserProfile, type UserProfile } from '../state/profile'
import { clearUserRole, setUserRole, type UserRole } from '../state/session'
import { clearAuthentication, isAuthenticated, setAuthenticated } from '../state/auth'
import { ApiError } from './apiError'
import { reportError } from '../observability/errorTracking'

export type AuthSessionPayload = {
  authenticated: boolean
  profile?: UserProfile
  role?: UserRole
}

export async function syncAuthSession() {
  if (!isRemoteMode()) {
    return {
      authenticated: isAuthenticated(),
      profile: undefined,
      role: undefined,
    } satisfies AuthSessionPayload
  }
  const session = await requestJson<AuthSessionPayload>('/auth/session')
  applyAuthSession(session)
  return session
}

export async function completeAuthCallback(search: string) {
  if (!isRemoteMode()) {
    const params = new URLSearchParams(search)
    const status = params.get('status')
    const authenticated = status !== 'error'
    if (authenticated) {
      setAuthenticated(true)
      const employeeId = params.get('employeeId')
      const name = params.get('name')
      const organization = params.get('organization')
      const role = params.get('role')
      if (employeeId && name && organization) {
        saveUserProfile({ employeeId, name, organization })
      }
      if (role === 'employee' || role === 'manager' || role === 'admin') {
        setUserRole(role)
      }
    } else {
      clearAuthState()
    }
    return {
      authenticated,
      profile: undefined,
      role: undefined,
    } satisfies AuthSessionPayload
  }

  const query = search ? `?${new URLSearchParams(search).toString()}` : ''
  const session = await requestJson<AuthSessionPayload>(`/auth/callback${query}`)
  applyAuthSession(session)
  return session
}

function applyAuthSession(session: AuthSessionPayload) {
  if (!session.authenticated) {
    clearAuthState()
    return
  }
  setAuthenticated(true)
  if (session.profile) {
    saveUserProfile(session.profile)
  }
  if (session.role) {
    setUserRole(session.role)
  }
}

function clearAuthState() {
  clearAuthentication()
  clearUserProfile()
  clearUserRole()
  clearJourneyData()
}

function isRemoteMode() {
  return runtimeConfig.apiMode === 'remote'
}

async function requestJson<T>(path: string): Promise<T> {
  const maxAttempts = 1 + Math.max(0, runtimeConfig.apiRetryCount)
  let attempt = 0

  while (attempt < maxAttempts) {
    try {
      return await requestJsonOnce<T>(path)
    } catch (error) {
      attempt += 1
      const retryable = isRetryableApiError(error) && attempt < maxAttempts
      if (retryable) continue
      if (error instanceof ApiError) {
        void reportError({
          at: new Date().toISOString(),
          message: `${error.code}:${error.message}`,
          source: `auth:${path}`,
        })
      }
      throw error
    }
  }

  throw new ApiError('unknown', 'API retry exhausted')
}

async function requestJsonOnce<T>(path: string): Promise<T> {
  if (!runtimeConfig.apiBaseUrl) {
    throw new ApiError('misconfigured', 'VITE_API_BASE_URL is required when VITE_API_MODE=remote')
  }
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 6000)

  try {
    const response = await fetch(`${runtimeConfig.apiBaseUrl}${path}`, {
      method: 'GET',
      credentials: 'include',
      signal: controller.signal,
    })

    if (!response.ok) {
      if (response.status === 401) throw new ApiError('unauthorized', 'Authentication required', 401)
      if (response.status === 403) throw new ApiError('forbidden', 'Access denied', 403)
      if (response.status >= 500) throw new ApiError('server', 'Server error', response.status)
      throw new ApiError('unknown', `API request failed: ${response.status}`, response.status)
    }

    const payload = (await response.json()) as T | { data: T }
    if (payload && typeof payload === 'object' && 'data' in payload) {
      return payload.data
    }
    return payload as T
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('timeout', 'API request timeout')
    }
    if (error instanceof ApiError) throw error
    throw new ApiError('network', 'Network error')
  } finally {
    clearTimeout(timeout)
  }
}

function isRetryableApiError(error: unknown) {
  if (!(error instanceof ApiError)) return false
  return error.code === 'network' || error.code === 'timeout' || error.code === 'server'
}
