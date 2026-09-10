'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'

type UserTopNavProps = {
  activeRoute?: string
  authenticated?: boolean
  role?: string | null
  userName?: string | null
  organization?: string | null
  loginHref?: string
  signupHref?: string
  onLogout?: () => void | Promise<void>
  rightSlot?: ReactNode
}

const navItems = [
  { label: '홈', route: '/' },
  { label: '나의 학습', route: '/history' },
  { label: '역량 진단', route: '/diagnosis' },
  { label: '챗봇 상담', route: '/chatbot' },
  { label: '플랫폼 소개', route: '/platform-intro' },
]

const groupedRoutes: Record<string, string[]> = {
  '/history': ['/history', '/recommendation', '/learning-path', '/course-linking', '/analytics'],
  '/diagnosis': ['/diagnosis', '/diagnosis/results'],
}

export function UserTopNav({
  activeRoute,
  authenticated = false,
  role,
  userName,
  organization,
  loginHref = '/login',
  signupHref = '/signup',
  onLogout,
  rightSlot,
}: UserTopNavProps) {
  const router = useRouter()

  function goTo(route: string) {
    router.push(route)
  }

  function isActive(route: string) {
    if (!activeRoute) return false
    if (route === activeRoute) return true
    return groupedRoutes[route]?.includes(activeRoute) || false
  }

  const roleLabel = role === 'admin' ? '관리자' : role === 'manager' ? '매니저' : '학습자'

  return (
    <header className="home-react-header">
      <div className="home-react-header-inner">
        <button className="home-react-brand" onClick={() => goTo('/')} type="button">
          <img alt="Company" src="/brand/logo.png" />
          <span>On Learning Searcher</span>
        </button>
        <nav aria-label="주요 이동" className="home-react-nav">
          {navItems.map((item) => (
            <button
              className={isActive(item.route) ? 'active' : ''}
              key={item.route}
              onClick={() => goTo(item.route)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="home-react-header-actions">
          {rightSlot}
          {authenticated ? (
            <>
              <div className="home-react-user">
                <div>
                  <p>
                    <span>{userName || '회사 구성원'}</span>
                    <em>{roleLabel}</em>
                  </p>
                  <small>{organization || '회사'}</small>
                </div>
                <span className="material-symbols-outlined">account_circle</span>
              </div>
              <button
                className="home-react-auth"
                onClick={() => {
                  if (onLogout) {
                    void onLogout()
                    return
                  }
                  goTo('/')
                }}
                type="button"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <button className="home-react-secondary-auth" onClick={() => goTo(signupHref)} type="button">
                회원가입
              </button>
              <button className="home-react-auth" onClick={() => goTo(loginHref)} type="button">
                로그인
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
