'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { clearIdentity, getDisplayUser } from '@/lib/stitch-ui'
import type { UserProfile } from '@/lib/auth-client'

const adminNavItems = [
  { label: '대시보드', href: '/admin' },
  { label: '부서 분석', href: '/admin/departments' },
  { label: '과정 관리', href: '/admin/courses' },
  { label: '회원 관리', href: '/admin/users' },
  { label: '공지 / FAQ', href: '/admin/boards' },
  { label: '학습자 페이지', href: '/' },
]

export function AdminTopNav({ profile }: { profile?: UserProfile | null }) {
  const router = useRouter()
  const pathname = usePathname()
  const user = getDisplayUser(profile)
  const [roleLabel] = useState<'관리자' | '학습자'>(() => {
    if (typeof window === 'undefined') return '학습자'
    return window.localStorage.getItem('on_learning_user_role_v1') === 'admin' ? '관리자' : '학습자'
  })
  const [elapsed, setElapsed] = useState('00:00:00')

  useEffect(() => {
    const tick = () => {
      const startedAt = window.localStorage.getItem('on_learning_session_started_at_v1')
      if (!startedAt) {
        setElapsed('00:00:00')
        return
      }
      const start = new Date(startedAt).getTime()
      if (Number.isNaN(start)) {
        setElapsed('00:00:00')
        return
      }
      const diff = Math.max(0, Math.floor((Date.now() - start) / 1000))
      const hours = String(Math.floor(diff / 3600)).padStart(2, '0')
      const minutes = String(Math.floor((diff % 3600) / 60)).padStart(2, '0')
      const seconds = String(diff % 60).padStart(2, '0')
      setElapsed(`${hours}:${minutes}:${seconds}`)
    }

    document.body.classList.add('body-admin-plain')
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => {
      document.body.classList.remove('body-admin-plain')
      window.clearInterval(timer)
    }
  }, [])

  return (
    <header className="shell-topbar admin-fixed-nav">
      <div className="shell-brand-row admin-topbar-left">
        <Link className="shell-brand" href="/admin">
          <Image alt="현대위아 로고" className="shell-brand-image" height={32} src="/brand/logo.png" width={132} />
          <span className="shell-brand-subtitle">administrator</span>
        </Link>
        <nav aria-label="administrator menu" className="admin-page-nav">
          {adminNavItems.map((item) => (
            <Link
              className={pathname === item.href ? 'admin-page-link active' : 'admin-page-link'}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="shell-actions admin-topbar-right">
        <div className="admin-session-meta">
          <span className="admin-session-label">진행 시간</span>
          <span className="admin-session-time">{elapsed}</span>
        </div>
        <div className="admin-user-pill">
          <div className="admin-user-copy">
            <p>
              <span>{user.name || '관리자'}</span>
              <span className={roleLabel === '관리자' ? 'admin-role-badge is-admin' : 'admin-role-badge'}>
                {roleLabel}
              </span>
            </p>
            <p>{user.organization || '현대위아 / 관리자'}</p>
          </div>
          <div aria-hidden="true" className="admin-user-avatar">
            <span className="material-symbols-outlined">account_circle</span>
          </div>
        </div>
        <button
          className="auth-shell-btn auth-shell-btn-primary admin-logout-btn"
          onClick={async () => {
            await clearIdentity()
            router.push('/')
          }}
          type="button"
        >
          로그아웃
        </button>
      </div>
    </header>
  )
}
