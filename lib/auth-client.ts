'use client'

import { readSupabaseAuthSession, bridgeLegacyCallbackSessionToSupabase } from '@/lib/supabase/auth-bridge'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'

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
  const session = await readSupabaseAuthSession()
  applyAuthSession(session)
  return session
}

export async function loginWithPassword(payload: LoginPayload) {
  const supabase = getSupabaseBrowserClient()
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    fn: string,
    args?: Record<string, unknown>,
  ) => Promise<{ data?: unknown; error: { message?: string } | null }>
  const employeeId = String(payload.employeeId || '').trim()
  const password = String(payload.password || '')
  if (!employeeId || !password) {
    throw new Error('missing-login-fields')
  }

  const email = await resolveLoginEmail(employeeId)
  const signIn = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (signIn.error || !signIn.data.user) {
    throw signIn.error || new Error('supabase-login-failed')
  }

  const linkResult = await rpc('link_current_auth_user', {
    p_employee_id: employeeId,
    p_company_email: email,
  }) as unknown as { error: { message?: string } | null }
  if (linkResult.error) {
    throw new Error(linkResult.error.message || 'supabase-link-user-failed')
  }

  const session = await readSupabaseAuthSession()
  if (!session.authenticated) {
    throw new Error('supabase-session-profile-missing')
  }
  applyAuthSession(session)
  return session
}

export async function signupWithPassword(payload: SignupPayload) {
  const supabase = getSupabaseBrowserClient()
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    fn: string,
    args?: Record<string, unknown>,
  ) => Promise<{ data?: unknown; error: { message?: string } | null }>
  const signUp = await supabase.auth.signUp({
    email: String(payload.companyEmail || '').trim().toLowerCase(),
    password: String(payload.password || ''),
    options: {
      data: {
        employee_id: String(payload.employeeId || '').trim(),
        name: String(payload.name || '').trim(),
      },
    },
  })
  if (signUp.error || !signUp.data.user) {
    throw signUp.error || new Error('supabase-signup-failed')
  }

  if (!signUp.data.session) {
    const signIn = await supabase.auth.signInWithPassword({
      email: String(payload.companyEmail || '').trim().toLowerCase(),
      password: String(payload.password || ''),
    })
    if (signIn.error || !signIn.data.user) {
      throw signIn.error || new Error('supabase-signin-after-signup-failed')
    }
  }

  const registerResult = await rpc('register_current_auth_user', {
    p_employee_id: String(payload.employeeId || '').trim(),
    p_name: String(payload.name || '').trim(),
    p_organization: String(payload.organization || '').trim(),
    p_division: String(payload.division || '').trim() || null,
    p_office: String(payload.office || '').trim() || null,
    p_team: String(payload.team || '').trim() || null,
    p_company_email: String(payload.companyEmail || '').trim().toLowerCase(),
    p_interest_course: String(payload.interestCourse || '').trim() || null,
  }) as unknown as { error: { message?: string } | null }
  if (registerResult.error) {
    throw new Error(registerResult.error.message || 'supabase-register-user-failed')
  }

  const session = await readSupabaseAuthSession()
  if (!session.authenticated) {
    throw new Error('supabase-session-profile-missing')
  }
  applyAuthSession(session)
  return session
}

export async function completeAuthCallback(search: string) {
  const query = search.startsWith('?') ? search : `?${search}`
  const params = new URLSearchParams(query)
  const status = String(params.get('status') || '').trim().toLowerCase()
  if (status === 'error') {
    const session = { authenticated: false } satisfies AuthSessionPayload
    applyAuthSession(session)
    return session
  }
  const employeeId = String(params.get('employeeId') || '').trim()
  const name = String(params.get('name') || '').trim()
  const organization = String(params.get('organization') || '').trim()
  if (!employeeId || !name || !organization) {
    throw new Error('missing-sso-callback-fields')
  }
  const session = await bridgeLegacyCallbackSessionToSupabase({
    employeeId,
    name,
    organization,
    companyEmail: `${employeeId}@company.local`,
  })
  applyAuthSession(session)
  return session
}

export async function logoutSession() {
  try {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    return { ok: true }
  } finally {
    clearAuthState()
  }
}

async function resolveLoginEmail(employeeId: string) {
  if (employeeId.includes('@')) {
    return employeeId.trim().toLowerCase()
  }
  const supabase = getSupabaseBrowserClient()
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    fn: string,
    args?: Record<string, unknown>,
  ) => Promise<{ data: string | null; error: { message?: string } | null }>
  const { data, error } = (await rpc('lookup_login_email', {
    p_employee_id: employeeId,
  })) as unknown as { data: string | null; error: { message?: string } | null }
  if (error || !data) {
    throw new Error(error?.message || 'login-email-not-found')
  }
  return String(data).trim().toLowerCase()
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
