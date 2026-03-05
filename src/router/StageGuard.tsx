import type { ReactElement } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { getRouteAccessDecision, type RouteAccessPolicy } from '../shared/orchestration/access'
import { runtimeConfig } from '../shared/config/runtime'
import { isFeatureEnabled } from '../shared/orchestration/features'
import { getJourneyStage, type JourneyStage } from '../shared/state/learningFlow'
import { isAuthenticated } from '../shared/state/auth'
import { hasUserProfile } from '../shared/state/profile'
import { getUserRole, type UserRole } from '../shared/state/session'
import type { FeatureKey } from '../shared/config/runtime'

type StageGuardProps = {
  minStage: JourneyStage
  children: ReactElement
  requireProfile?: boolean
  requireAuth?: boolean
  allowedRoles?: UserRole[]
  featureKey?: FeatureKey
}

export function StageGuard({
  minStage,
  children,
  requireProfile = true,
  requireAuth = true,
  allowedRoles,
  featureKey,
}: StageGuardProps) {
  const location = useLocation()
  const requestedPath = `${location.pathname}${location.search}`
  const withNext = (gate: string, nextPath?: string | null) => {
    const params = new URLSearchParams()
    params.set('gate', gate)
    if (nextPath) {
      params.set('next', nextPath)
    }
    return `/?${params.toString()}`
  }

  if (featureKey && !isFeatureEnabled(featureKey)) {
    return <Navigate replace to={withNext('feature-disabled', requestedPath)} />
  }

  const policy: RouteAccessPolicy = {
    minStage,
    requireAuth,
    requireProfile,
    allowedRoles,
  }
  const current = getJourneyStage()
  const decision = getRouteAccessDecision(policy, {
    authenticated: isAuthenticated(),
    hasProfile: hasUserProfile(),
    role: getUserRole(),
    stage: current,
  })

  if (!decision.allowed && decision.gate === 'auth-required') {
    return <Navigate replace to={withNext('auth-required', requestedPath)} />
  }
  if (!decision.allowed && decision.gate === 'profile-required') {
    return <Navigate replace to={withNext('profile-required', requestedPath)} />
  }
  if (!decision.allowed && decision.gate === 'role-denied') {
    return <Navigate replace to={withNext('role-denied', requestedPath)} />
  }
  if (!decision.allowed && decision.gate === 'stage-locked' && runtimeConfig.apiMode === 'remote') {
    // In remote mode, stage can be ahead on server-side. Let page-level loaders handle prerequisite UX.
    return children
  }
  if (!decision.allowed) {
    return <Navigate replace to={withNext('stage-locked', decision.nextPath)} />
  }

  return children
}
