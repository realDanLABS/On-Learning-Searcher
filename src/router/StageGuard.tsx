import type { ReactElement } from 'react'
import { Navigate } from 'react-router-dom'

import { getJourneyStage, type JourneyStage } from '../shared/state/learningFlow'
import { hasUserProfile } from '../shared/state/profile'

type StageGuardProps = {
  minStage: JourneyStage
  children: ReactElement
  requireProfile?: boolean
}

const order: JourneyStage[] = ['start', 'diagnosis_done', 'course_selected', 'enrollment_done']

export function StageGuard({ minStage, children, requireProfile = true }: StageGuardProps) {
  if (requireProfile && !hasUserProfile()) {
    return <Navigate replace to="/" />
  }

  const current = getJourneyStage()

  if (order.indexOf(current) < order.indexOf(minStage)) {
    if (minStage === 'diagnosis_done') return <Navigate replace to="/diagnosis" />
    if (minStage === 'course_selected') return <Navigate replace to="/recommendation" />
    if (minStage === 'enrollment_done') return <Navigate replace to="/course-linking" />
  }

  return children
}
