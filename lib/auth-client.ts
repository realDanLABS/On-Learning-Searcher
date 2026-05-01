'use client'

import { runtime } from '@/lib/runtime'

export type UserRole = 'employee' | 'manager' | 'admin'

export type UserProfile = {
  employeeId: string
  name: string
  organization: string
  division?: string
  office?: string
  team?: string
  companyEmail?: string
  interestCourse?: string
}

export type AuthSessionPayload = {
  authenticated: boolean
  profile?: UserProfile
  role?: UserRole
}

export type LoginPayload = {
  employeeId: string
  password: string
}

export type SignupPayload = {
  division: string
  office?: string
  team: string
  employeeId: string
  companyEmail: string
  password: string
  name: string
  interestCourse: string
  organization: string
  nextPath?: string
}

export async function syncAuthSession() {
  const session = await requestJson<AuthSessionPayload>('/auth/session')
  applyAuthSession(session)
  return session
}

export async function loginWithPassword(payload: LoginPayload) {
  const session = await requestJson<AuthSessionPayload>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  applyAuthSession(session)
  return session
}

export async function signupWithPassword(payload: SignupPayload) {
  const session = await requestJson<AuthSessionPayload>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  applyAuthSession(session)
  return session
}

export async function completeAuthCallback(search: string) {
  const query = search.startsWith('?') ? search : `?${search}`
  const session = await requestJson<AuthSessionPayload>(`/auth/callback${query}`)
  applyAuthSession(session)
  return session
}

export async function logoutSession() {
  try {
    return await requestJson<{ ok: boolean }>('/auth/logout', { method: 'POST' })
  } finally {
    clearAuthState()
  }
}

const KEY_AUTHENTICATED = 'on_learning_authenticated_v1'
const KEY_PROFILE = 'on_learning_user_profile_v1'
const KEY_ROLE = 'on_learning_user_role_v1'
const KEY_SESSION_STARTED_AT = 'on_learning_session_started_at_v1'
const JOURNEY_KEYS = [
  'on_learning_diagnosis_payload_v1',
  'on_learning_diagnosis_history_v1',
  'on_learning_selected_course_v1',
  'on_learning_favorite_courses_v1',
  'on_learning_enrollment_records_v1',
  'on_learning_journey_events_v1',
  'on_learning_remote_stage_snapshot_v1',
]

function applyAuthSession(session: AuthSessionPayload) {
  if (!session.authenticated) {
    clearAuthState()
    return
  }

  window.localStorage.setItem(KEY_AUTHENTICATED, '1')

  if (session.profile) {
    window.localStorage.setItem(KEY_PROFILE, JSON.stringify(session.profile))
  }

  if (session.role) {
    window.localStorage.setItem(KEY_ROLE, session.role)
  }

  if (!window.localStorage.getItem(KEY_SESSION_STARTED_AT)) {
    window.localStorage.setItem(KEY_SESSION_STARTED_AT, new Date().toISOString())
  }
}

function clearAuthState() {
  window.localStorage.removeItem(KEY_AUTHENTICATED)
  window.localStorage.removeItem(KEY_PROFILE)
  window.localStorage.removeItem(KEY_ROLE)
  window.localStorage.removeItem(KEY_SESSION_STARTED_AT)

  for (const key of JOURNEY_KEYS) {
    window.localStorage.removeItem(key)
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${runtime.apiBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    let message = `API request failed: ${response.status}`
    try {
      const payload = (await response.json()) as { error?: { message?: string } }
      message = payload?.error?.message || message
    } catch {
      // ignore payload parse failure
    }
    throw new Error(message)
  }

  return response.json() as Promise<T>
}
