'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { StitchFrame } from '@/components/stitch-frame'
import { UserTopNav } from '@/components/user-top-nav'
import { syncAuthSession } from '@/lib/auth-client'
import { clearIdentity, getDisplayUser } from '@/lib/stitch-ui'

export function PlatformIntroScreen() {
  const router = useRouter()
  const [session, setSession] = useState<Awaited<ReturnType<typeof syncAuthSession>> | null>(null)

  useEffect(() => {
    void syncAuthSession()
      .then(setSession)
      .catch(() => setSession(null))
  }, [])

  const user = getDisplayUser(session?.profile)

  async function handleAction(action: string, data: unknown) {
    const payloadData = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
    if (action === 'goto') {
      router.push(typeof payloadData.route === 'string' ? payloadData.route : '/')
      return
    }
    if (action === 'notify') {
      window.alert(typeof payloadData.message === 'string' ? payloadData.message : '준비 중인 기능입니다.')
      return
    }
    if (action === 'logout') {
      await clearIdentity()
      router.push('/')
    }
  }

  return (
    <div className="home-react-page">
      <UserTopNav
        activeRoute="/platform-intro"
        authenticated={Boolean(session?.authenticated)}
        loginHref="/login?next=%2Fplatform-intro"
        onLogout={async () => {
          await clearIdentity()
          router.push('/')
        }}
        organization={user.organization}
        role={session?.role}
        signupHref="/signup?next=%2Fplatform-intro"
        userName={user.name}
      />
      <StitchFrame file="10-platform-intro.html" hideEmbeddedHeader onAction={handleAction} payload={{ authenticated: Boolean(session?.authenticated) }} />
    </div>
  )
}
