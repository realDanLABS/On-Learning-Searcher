import { useLocation, useNavigate } from 'react-router-dom'

import { hasDiagnosisDraft } from '../../features/diagnosis/draftStorage'
import { isAuthenticated } from '../state/auth'
import { getJourneyStage } from '../state/learningFlow'
import { hasUserProfile } from '../state/profile'
import { getUserRole } from '../state/session'
import { withJourneyFrom } from './journeyLink'
import { resolveBestReachablePath } from './smartPath'

export function useGuidedNavigate() {
  const location = useLocation()
  const navigate = useNavigate()

  return (preferredPath: string, gateNextPath?: string | null) => {
    const preferredWithFrom = withJourneyFrom(preferredPath, location.pathname)
    const gateNextWithFrom = gateNextPath ? withJourneyFrom(gateNextPath, location.pathname) : gateNextPath
    const nextPath = resolveBestReachablePath({
      preferredPath: preferredWithFrom,
      gateNextPath: gateNextWithFrom,
      context: {
        authenticated: isAuthenticated(),
        hasProfile: hasUserProfile(),
        role: getUserRole(),
        stage: getJourneyStage(),
      },
      hasDiagnosisDraft: hasDiagnosisDraft(),
    })
    navigate(nextPath ?? preferredWithFrom)
  }
}
