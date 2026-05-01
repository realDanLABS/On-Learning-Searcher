import { Suspense } from 'react'

import { SignupScreen } from '@/components/signup-screen'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const params = await searchParams

  return (
    <Suspense>
      <SignupScreen next={params.next} />
    </Suspense>
  )
}
