import type { ReactElement } from 'react'
import { Navigate } from 'react-router-dom'

import { canAccessRoute, type RouteAccessPolicy } from '../shared/orchestration/access'
import { isFeatureEnabled } from '../shared/orchestration/features'
import {
  getRedirectForStage,
} from '../shared/orchestration/journey'
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
  const allowed = canAccessRoute(policy, {
    authenticated: isAuthenticated(),
    hasProfile: hasUserProfile(),
    role: getUserRole(),
    stage: current,
  })

  if (!allowed && requireAuth && !isAuthenticated()) {
    return <Navigate replace to="/?gate=auth-required" />
  }
  if (!allowed && requireProfile && !hasUserProfile()) {
    return <Navigate replace to="/?gate=profile-required" />
  }
  if (!allowed && allowedRoles && !allowedRoles.includes(getUserRole())) {
    return <Navigate replace to="/?gate=role-denied" />
  }
  if (!allowed) {
    return <Navigate replace to={`/?gate=stage-locked&next=${encodeURIComponent(getRedirectForStage(minStage))}`} />
  }

  return children
}
