import type { ReactElement } from 'react'
import { Navigate } from 'react-router-dom'

import { getRouteAccessDecision, type RouteAccessPolicy } from '../shared/orchestration/access'
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
  if (featureKey && !isFeatureEnabled(featureKey)) {
    return <Navigate replace to="/?gate=feature-disabled" />
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
    return <Navigate replace to="/?gate=auth-required" />
  }
  if (!decision.allowed && decision.gate === 'profile-required') {
    return <Navigate replace to="/?gate=profile-required" />
  }
  if (!decision.allowed && decision.gate === 'role-denied') {
    return <Navigate replace to="/?gate=role-denied" />
  }
  if (!decision.allowed) {
    const next = decision.nextPath ? `&next=${encodeURIComponent(decision.nextPath)}` : ''
    return <Navigate replace to={`/?gate=stage-locked${next}`} />
  }

  return children
}
