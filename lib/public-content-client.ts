'use client'

import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import type { FaqItem, NoticeItem } from '@/lib/stitch-ui'

export async function fetchPublicNotices() {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from('learning_notices')
    .select('id, category, date, title, summary')
    .order('date', { ascending: false })
    .limit(6)

  if (error) {
    throw error
  }

  return (data || []) as NoticeItem[]
}

export async function fetchPublicFaqs() {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from('learning_faqs')
    .select('id, question, answer')
    .order('created_at', { ascending: true })
    .limit(8)

  if (error) {
    throw error
  }

  return (data || []) as FaqItem[]
}
