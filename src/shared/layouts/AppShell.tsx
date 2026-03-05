import { Link, NavLink, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

import { runtimeConfig } from '../config/runtime'
import { featureRoutes } from '../../router/routeConfig'
import { JourneyActionBar } from '../components/JourneyActionBar'
import { JourneyFlowGuide } from '../components/JourneyFlowGuide'
import { JourneyProgressPanel } from '../components/JourneyProgressPanel'
import { getRouteAccessDecision } from '../orchestration/access'
import { isFeatureEnabled } from '../orchestration/features'
import { clearJourneyData, getJourneyStage } from '../state/learningFlow'
import { clearUserProfile, getUserProfile } from '../state/profile'
import { clearUserRole, getUserRole } from '../state/session'
import { clearAuthentication, isAuthenticated } from '../state/auth'
import { appendAuditLog } from '../observability/audit'
import { maskEmployeeId } from '../security/privacy'

type AppShellProps = {
  title: string
  description: string
  children: ReactNode
}

export function AppShell({ title, description, children }: AppShellProps) {
  const location = useLocation()
  const profile = getUserProfile()
  const authenticated = isAuthenticated()
  const role = getUserRole()
  const stage = getJourneyStage()
  const onLogout = () => {
    appendAuditLog('logout', `로그아웃: role=${role}`)
    clearAuthentication()
    clearJourneyData()
    clearUserProfile()
    clearUserRole()
    if (runtimeConfig.apiMode === 'remote' && runtimeConfig.ssoLogoutUrl) {
      window.location.href = runtimeConfig.ssoLogoutUrl
      return
    }
    window.location.href = '/'
  }

  const buildGateRedirect = (gate: string, nextPath?: string | null) => {
    const params = new URLSearchParams()
    params.set('gate', gate)
    if (nextPath) params.set('next', nextPath)
    return `/?${params.toString()}`
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">HYUNDAI WIA</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <div className="header-actions">
          <Link className="home-link" to="/">
            홈으로
          </Link>
          {authenticated && (
            <button className="secondary-btn" onClick={onLogout} type="button">
              로그아웃
            </button>
          )}
        </div>
      </header>
      {profile && (
        <section className="profile-banner" aria-label="사용자 프로필">
          <p>
            {profile.name} ({maskEmployeeId(profile.employeeId)}) · {profile.organization}
          </p>
        </section>
      )}

      <nav className="feature-nav" aria-label="주요 기능 이동">
        {featureRoutes.map((route) => {
          const featureEnabled = isFeatureEnabled(route.featureKey)
          const decision = getRouteAccessDecision(route, {
            authenticated,
            hasProfile: Boolean(profile),
            role,
            stage,
          })

          if (!featureEnabled) {
            return (
              <Link
                className="feature-link locked"
                key={route.path}
                to={buildGateRedirect('feature-disabled')}
                title="운영 정책상 비활성화된 기능입니다."
              >
                {route.label} (비활성)
              </Link>
            )
          }

          if (!decision.allowed) {
            return (
              <Link
                className="feature-link locked"
                key={route.path}
                to={buildGateRedirect(decision.gate ?? 'stage-locked', decision.nextPath)}
                title="현재 단계에서는 이동할 수 없습니다. 안내 페이지로 이동합니다."
              >
                {route.label} (잠금)
              </Link>
            )
          }

          return (
            <NavLink
              className={({ isActive }) => (isActive ? 'feature-link active' : 'feature-link')}
              key={route.path}
              to={route.path}
            >
              {route.label}
            </NavLink>
          )
        })}
      </nav>

      <main className="content">{children}</main>
      <JourneyFlowGuide />
      {location.pathname !== '/' && <JourneyActionBar />}
      <JourneyProgressPanel />
    </div>
  )
}
