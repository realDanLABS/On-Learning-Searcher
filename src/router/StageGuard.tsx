import type { ReactElement } from 'react'
import { Navigate } from 'react-router-dom'

import {
  getRedirectForStage,
  isStageAllowed,
} from '../shared/orchestration/journey'
import { getJourneyStage, type JourneyStage } from '../shared/state/learningFlow'
import { isAuthenticated } from '../shared/state/auth'
import { hasUserProfile } from '../shared/state/profile'
import { getUserRole, type UserRole } from '../shared/state/session'

type StageGuardProps = {
  minStage: JourneyStage
  children: ReactElement
  requireProfile?: boolean
  requireAuth?: boolean
  allowedRoles?: UserRole[]
}

export function StageGuard({
  minStage,
  children,
  requireProfile = true,
  requireAuth = true,
  allowedRoles,
}: StageGuardProps) {
  if (requireAuth && !isAuthenticated()) {
    return <Navigate replace to="/" />
  }

  if (allowedRoles && !allowedRoles.includes(getUserRole())) {
    return <Navigate replace to="/" />
  }

  if (requireProfile && !hasUserProfile()) {
    return <Navigate replace to="/" />
  }

  const current = getJourneyStage()

  if (!isStageAllowed(current, minStage)) {
    return <Navigate replace to={getRedirectForStage(minStage)} />
  }

  return children
}
