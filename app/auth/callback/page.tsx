import { Suspense } from 'react'

import { AuthCallbackScreen } from '@/components/auth-callback-screen'

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') query.set(key, value)
    if (Array.isArray(value)) {
      for (const item of value) query.append(key, item)
    }
  }

  const next = typeof params.next === 'string' ? params.next : undefined

  return (
    <Suspense>
      <AuthCallbackScreen search={query.toString()} next={next} />
    </Suspense>
  )
}
