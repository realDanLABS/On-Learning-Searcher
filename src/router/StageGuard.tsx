import type { ReactElement } from 'react'
import { Navigate } from 'react-router-dom'

import {
  getRedirectForStage,
  isStageAllowed,
} from '../shared/orchestration/journey'
import { getJourneyStage, type JourneyStage } from '../shared/state/learningFlow'
import { hasUserProfile } from '../shared/state/profile'

type StageGuardProps = {
  minStage: JourneyStage
  children: ReactElement
  requireProfile?: boolean
}

export function StageGuard({ minStage, children, requireProfile = true }: StageGuardProps) {
  if (requireProfile && !hasUserProfile()) {
    return <Navigate replace to="/" />
  }

  const current = getJourneyStage()

  if (!isStageAllowed(current, minStage)) {
    return <Navigate replace to={getRedirectForStage(minStage)} />
  }

  return children
}
