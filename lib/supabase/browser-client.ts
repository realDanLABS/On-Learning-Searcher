'use client'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/types'

let browserClient: SupabaseClient<Database> | null = null

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
  }

  if (!anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
  }

  return { url, anonKey }
}

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient

  const { url, anonKey } = getSupabaseEnv()
  browserClient = createClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })

  return browserClient
}
