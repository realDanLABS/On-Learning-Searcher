import { useNavigate } from 'react-router-dom'

import { hasDiagnosisDraft } from '../../features/diagnosis/draftStorage'
import { isAuthenticated } from '../state/auth'
import { getJourneyStage } from '../state/learningFlow'
import { hasUserProfile } from '../state/profile'
import { getUserRole } from '../state/session'
import { resolveBestReachablePath } from './smartPath'

export function useGuidedNavigate() {
  const navigate = useNavigate()

  return (preferredPath: string, gateNextPath?: string | null) => {
    const nextPath = resolveBestReachablePath({
      preferredPath,
      gateNextPath,
      context: {
        authenticated: isAuthenticated(),
        hasProfile: hasUserProfile(),
        role: getUserRole(),
        stage: getJourneyStage(),
      },
      hasDiagnosisDraft: hasDiagnosisDraft(),
    })
    navigate(nextPath ?? preferredPath)
  }
}
