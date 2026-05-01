'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { completeAuthCallback } from '@/lib/auth-client'
import { sanitizeInternalPath } from '@/lib/paths'
import { AuthShell } from '@/components/auth-shell'

export function AuthCallbackScreen({
  search,
  next,
}: {
  search: string
  next?: string
}) {
  const router = useRouter()
  const [error, setError] = useState('')

  useEffect(() => {
    const run = async () => {
      try {
        const session = await completeAuthCallback(search)
        if (!session.authenticated) {
          setError('로그인에 실패했습니다. 다시 시도해 주세요.')
          return
        }
        const nextPath = sanitizeInternalPath(next) ?? '/diagnosis'
        router.replace(nextPath)
      } catch {
        setError('인증 처리 중 오류가 발생했습니다. 다시 시도해 주세요.')
      }
    }

    void run()
  }, [next, router, search])

  return (
    <AuthShell description="SSO 인증 결과를 확인하고 있습니다." title="인증 처리 중">
      <section className="hero-card">
        <h2>로그인 콜백 처리</h2>
        <p className="hint-text">{error || '인증 정보를 확인 중입니다...'}</p>
        <div className="journey-actions">
          <Link className="secondary-btn link-btn" href="/">
            홈으로 이동
          </Link>
        </div>
      </section>
    </AuthShell>
  )
}
