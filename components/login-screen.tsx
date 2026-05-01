'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useMemo, useState } from 'react'

import { loginWithPassword } from '@/lib/auth-client'
import { sanitizeInternalPath } from '@/lib/paths'
import { AuthShell } from '@/components/auth-shell'

export function LoginScreen({
  next,
  employeeId: initialEmployeeId,
}: {
  next?: string
  employeeId?: string
}) {
  const router = useRouter()
  const nextPath = sanitizeInternalPath(next) ?? '/diagnosis'
  const [employeeId, setEmployeeId] = useState(initialEmployeeId ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const helperText = useMemo(
    () => (nextPath === '/diagnosis' ? '로그인 후 바로 역량 진단으로 이동합니다.' : '학습 여정을 이어갈 계정으로 로그인하세요.'),
    [nextPath],
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    try {
      await loginWithPassword({ employeeId, password })
      router.replace(nextPath)
    } catch {
      setError('로그인 정보가 일치하지 않습니다. 사원번호와 비밀번호를 다시 확인해 주세요.')
    }
  }

  return (
    <AuthShell description="가입한 정보로 로그인하고 학습 흐름을 이어가세요." hidePageHeader title="로그인">
      <section className="auth-panel">
        <div className="auth-panel-copy">
          <p className="eyebrow">On Learning Searcher</p>
          <h2>로그인</h2>
          <p>{helperText}</p>
        </div>

        <form className="auth-form-grid" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>사원번호</span>
            <input
              autoComplete="username"
              inputMode="numeric"
              maxLength={5}
              pattern="[0-9]{5}"
              placeholder="예: 12345"
              required
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value)}
            />
          </label>

          <label className="auth-field">
            <span>비밀번호</span>
            <input
              autoComplete="current-password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error ? <p className="auth-error">{error}</p> : null}

          <div className="auth-actions">
            <button className="auth-shell-btn auth-shell-btn-primary" type="submit">
              로그인
            </button>
            <Link className="auth-shell-btn auth-shell-btn-secondary" href={`/signup?next=${encodeURIComponent(nextPath)}`}>
              회원가입
            </Link>
          </div>
        </form>
      </section>
    </AuthShell>
  )
}
