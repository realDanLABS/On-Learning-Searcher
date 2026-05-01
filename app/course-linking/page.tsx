import { Suspense } from 'react'

import { CourseLinkingScreen } from '@/components/course-linking-screen'

export default async function CourseLinkingPage({
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

  return (
    <Suspense>
      <CourseLinkingScreen search={query.toString()} />
    </Suspense>
  )
}
