'use client'

import { isSupabaseMode } from '@/lib/data-mode'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'

type AppProfileRow = {
  id: string
  role: 'employee' | 'manager' | 'admin'
}

export async function getSupabaseAppProfile() {
  if (!isSupabaseMode()) return null

  const supabase = getSupabaseBrowserClient()
  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData.session?.user) return null

  const { data, error } = await supabase.from('my_profile').select('id, role').maybeSingle<AppProfileRow>()
  if (error || !data) return null
  return data
}

export async function hasSupabaseAppSession() {
  const profile = await getSupabaseAppProfile()
  return Boolean(profile?.id)
}
