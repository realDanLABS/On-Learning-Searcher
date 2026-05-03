'use client'

import { isSupabaseMode } from '@/lib/data-mode'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import type { AuthSessionPayload } from '@/lib/auth-client'

type BridgeProfile = {
  employeeId: string
  companyEmail?: string
  name?: string
}

async function linkSupabaseAuthUser(profile: BridgeProfile) {
  const supabase = getSupabaseBrowserClient()
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    fn: string,
    args?: Record<string, unknown>,
  ) => Promise<{ error: { message?: string } | null }>
  const { error } = (await rpc('link_current_auth_user', {
    p_employee_id: profile.employeeId,
    p_company_email: profile.companyEmail?.trim().toLowerCase() || null,
  })) as unknown as { error: { message?: string } | null }
  if (error) {
    throw error
  }
}

export async function bridgeLegacyPasswordSessionToSupabase(profile: BridgeProfile | undefined, password: string) {
  if (!isSupabaseMode()) return
  if (!profile?.companyEmail || !password) return

  const supabase = getSupabaseBrowserClient()
  const email = profile.companyEmail.trim().toLowerCase()

  let authUserId = ''
  const signIn = await supabase.auth.signInWithPassword({ email, password })
  if (!signIn.error && signIn.data.user) {
    authUserId = signIn.data.user.id
  } else {
    const signUp = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          employee_id: profile.employeeId,
          name: profile.name || '',
        },
      },
    })
    if (signUp.error || !signUp.data.user) {
      throw signUp.error || signIn.error || new Error('supabase-auth-bridge-failed')
    }
    authUserId = signUp.data.user.id
  }

  if (authUserId) {
    await linkSupabaseAuthUser(profile)
  }
}

export async function getSupabaseSessionUser() {
  if (!isSupabaseMode()) return null
  const supabase = getSupabaseBrowserClient()
  const { data } = await supabase.auth.getSession()
  return data.session?.user ?? null
}

export async function readSupabaseAuthSession(): Promise<AuthSessionPayload> {
  if (!isSupabaseMode()) return { authenticated: false }
  const supabase = getSupabaseBrowserClient()
  const [{ data: sessionData }, profileResult] = await Promise.all([
    supabase.auth.getSession(),
    supabase.from('my_profile').select('employee_id, role, name, organization, division, office, team, company_email, interest_course').maybeSingle(),
  ])
  const profile = profileResult.data as
    | {
        employee_id: string
        role: AuthSessionPayload['role']
        name: string
        organization: string
        division?: string | null
        office?: string | null
        team?: string | null
        company_email?: string | null
        interest_course?: string | null
      }
    | null
  if (!sessionData.session?.user || profileResult.error || !profile) {
    return { authenticated: false }
  }
  return {
    authenticated: true,
    role: profile.role,
    profile: {
      employeeId: profile.employee_id,
      name: profile.name,
      organization: profile.organization,
      division: profile.division || undefined,
      office: profile.office || undefined,
      team: profile.team || undefined,
      companyEmail: profile.company_email || undefined,
      interestCourse: profile.interest_course || undefined,
    },
  }
}

export async function bridgeLegacyCallbackSessionToSupabase(profile: {
  employeeId: string
  name: string
  organization: string
  companyEmail?: string
}) {
  if (!isSupabaseMode()) {
    throw new Error('supabase-mode-disabled')
  }

  const supabase = getSupabaseBrowserClient()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) {
    throw new Error('supabase-env-missing')
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/auth-callback-bridge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify(profile),
  })

  if (!response.ok) {
    throw new Error(`auth-callback-bridge-failed:${response.status}`)
  }

  const payload = (await response.json()) as {
    email: string
    tokenHash: string
    type?: 'email' | 'magiclink' | 'signup'
  }

  const verify = await supabase.auth.verifyOtp({
    token_hash: payload.tokenHash,
    type: payload.type === 'magiclink' || payload.type === 'signup' ? 'email' : (payload.type || 'email'),
  })
  if (verify.error || !verify.data.session) {
    throw verify.error || new Error('supabase-verify-otp-failed')
  }

  return readSupabaseAuthSession()
}
