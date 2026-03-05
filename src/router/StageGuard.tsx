import type { ReactElement } from 'react'
import { Navigate } from 'react-router-dom'

import {
  getRedirectForStage,
  isStageAllowed,
} from '../shared/orchestration/journey'
import { getJourneyStage, type JourneyStage } from '../shared/state/learningFlow'
import { isAuthenticated } from '../shared/state/auth'
import { hasUserProfile } from '../shared/state/profile'

type StageGuardProps = {
  minStage: JourneyStage
  children: ReactElement
  requireProfile?: boolean
  requireAuth?: boolean
}

export function StageGuard({
  minStage,
  children,
  requireProfile = true,
  requireAuth = true,
}: StageGuardProps) {
  if (requireAuth && !isAuthenticated()) {
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
