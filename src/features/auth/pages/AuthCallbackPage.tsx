import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { completeAuthCallback } from '../../../shared/api/authApi'
import { ApiErrorMessage } from '../../../shared/components/ApiErrorMessage'
import { AppShell } from '../../../shared/layouts/AppShell'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<unknown | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        setError(null)
        const session = await completeAuthCallback(location.search)
        if (session.authenticated) {
          navigate('/', { replace: true })
          return
        }
        setError('로그인에 실패했습니다. 다시 시도해 주세요.')
      } catch (caught) {
        setError(caught)
      }
    }
    void run()
  }, [location.search, navigate])

  return (
    <AppShell title="인증 처리 중" description="SSO 인증 결과를 확인하고 있습니다.">
      <section className="hero-card">
        <h2>로그인 콜백 처리</h2>
        {error ? (
          <ApiErrorMessage error={error} fallback="인증 처리 중 오류가 발생했습니다." />
        ) : (
          <p className="hint-text">인증 정보를 확인 중입니다...</p>
        )}
        <div className="journey-actions">
          <Link className="secondary-btn link-btn" to="/">
            홈으로 이동
          </Link>
        </div>
      </section>
    </AppShell>
  )
}
