import { Suspense } from 'react'

import { LoginScreen } from '@/components/login-screen'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; employeeId?: string }>
}) {
  const params = await searchParams

  return (
    <Suspense>
      <LoginScreen next={params.next} employeeId={params.employeeId} />
    </Suspense>
  )
}
