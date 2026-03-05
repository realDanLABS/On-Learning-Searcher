import { Link, useLocation } from 'react-router-dom'

import { featureRoutes, type FeatureRoute } from '../../router/routeConfig'
import { canAccessRoute } from '../orchestration/access'
import { isFeatureEnabled } from '../orchestration/features'
import { withJourneyFrom } from '../orchestration/journeyLink'
import { isAuthenticated } from '../state/auth'
import { getJourneyStage } from '../state/learningFlow'
import { hasUserProfile } from '../state/profile'
import { getUserRole } from '../state/session'

const guidedPaths = ['/diagnosis', '/recommendation', '/course-linking', '/history'] as const

export function JourneyFlowGuide() {
  const location = useLocation()
  const stage = getJourneyStage()
  const authenticated = isAuthenticated()
  const hasProfile = hasUserProfile()
  const role = getUserRole()

  const guideRoutes = guidedPaths
    .map((path) => featureRoutes.find((route) => route.path === path))
    .filter((route): route is FeatureRoute => Boolean(route))

  return (
    <section className="journey-flow-guide" aria-label="학습 여정 가이드">
      <h2>학습 여정 가이드</h2>
      <div className="journey-flow-grid">
        {guideRoutes.map((route) => {
          const enabled = isFeatureEnabled(route.featureKey)
          const allowed = canAccessRoute(route, { authenticated, hasProfile, role, stage })
          const isCurrent = location.pathname === route.path
          const isDone =
            route.path === '/diagnosis'
              ? stage !== 'start'
              : route.path === '/recommendation'
                ? stage === 'course_selected' || stage === 'enrollment_done'
                : route.path === '/course-linking'
                  ? stage === 'enrollment_done'
                  : stage === 'enrollment_done'

          return (
            <article className="journey-flow-card" key={route.path}>
              <p className="journey-flow-label">{route.label}</p>
              <p className="journey-flow-status">
                {isCurrent ? '현재 단계' : isDone ? '완료' : allowed && enabled ? '진행 가능' : '잠금'}
              </p>
              {allowed && enabled ? (
                <Link
                  className={isCurrent ? 'secondary-btn link-btn' : 'primary-btn link-btn'}
                  to={withJourneyFrom(route.path, location.pathname)}
                >
                  {isCurrent ? '현재 페이지' : '이동'}
                </Link>
              ) : (
                <p className="hint-text">선행 단계(로그인/프로필/진단)를 먼저 완료하세요.</p>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
