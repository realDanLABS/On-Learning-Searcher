import { runtimeConfig } from '../config/runtime'
import { reportError } from '../observability/errorTracking'
import { type UserProfile, saveUserProfile } from '../state/profile'
import { ApiError, toApiErrorFromStatus } from './apiError'

export async function saveProfile(profile: UserProfile): Promise<UserProfile> {
  if (!isRemoteMode()) {
    saveUserProfile(profile)
    return profile
  }

  const saved = await requestJson<UserProfile>(
    '/profile',
    {
      method: 'PUT',
      body: JSON.stringify(profile),
    },
    isUserProfile,
  )
  saveUserProfile(saved)
  return saved
}

function isRemoteMode() {
  return runtimeConfig.apiMode === 'remote'
}

async function requestJson<T>(
  path: string,
  init?: RequestInit,
  validate?: (value: unknown) => value is T,
): Promise<T> {
  const maxAttempts = 1 + Math.max(0, runtimeConfig.apiRetryCount)
  let attempt = 0

  while (attempt < maxAttempts) {
    try {
      return await requestJsonOnce<T>(path, init, validate)
    } catch (error) {
      attempt += 1
      const retryable = isRetryableApiError(error) && attempt < maxAttempts
      if (retryable) continue
      if (error instanceof ApiError) {
        void reportError({
          at: new Date().toISOString(),
          message: `${error.code}:${error.message}`,
          source: `profile:${path}`,
        })
      }
      throw error
    }
  }

  throw new ApiError('unknown', 'API retry exhausted')
}

async function requestJsonOnce<T>(
  path: string,
  init?: RequestInit,
  validate?: (value: unknown) => value is T,
): Promise<T> {
  if (!runtimeConfig.apiBaseUrl) {
    throw new ApiError('misconfigured', 'VITE_API_BASE_URL is required when VITE_API_MODE=remote')
  }

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 6000)

  try {
    const response = await fetch(`${runtimeConfig.apiBaseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      credentials: 'include',
      signal: controller.signal,
    })

    if (!response.ok) {
      throw toApiErrorFromStatus(response.status, `API request failed: ${response.status}`)
    }

    const payload = (await response.json()) as T | { data: T }
    if (payload && typeof payload === 'object' && 'data' in payload) {
      const data = payload.data
      if (validate && !validate(data)) {
        throw new ApiError('invalid_payload', `Invalid API payload: ${path}`, 502)
      }
      return data
    }
    if (validate && !validate(payload)) {
      throw new ApiError('invalid_payload', `Invalid API payload: ${path}`, 502)
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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isUserProfile(value: unknown): value is UserProfile {
  if (!isObject(value)) return false
  return (
    typeof value.employeeId === 'string' &&
    typeof value.name === 'string' &&
    typeof value.organization === 'string'
  )
}
