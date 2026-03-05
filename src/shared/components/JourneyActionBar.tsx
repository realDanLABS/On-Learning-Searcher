import { Link, useLocation } from 'react-router-dom'

import { getNextActionStatus } from '../orchestration/nextAction'
import { getPrevJourneyAction } from '../orchestration/journey'
import { isAuthenticated } from '../state/auth'
import { getJourneyStage } from '../state/learningFlow'
import { hasUserProfile } from '../state/profile'
import { getUserRole } from '../state/session'
import { hasDiagnosisDraft } from '../../features/diagnosis/draftStorage'
import { withJourneyFrom } from '../orchestration/journeyLink'

export function JourneyActionBar() {
  const location = useLocation()
  const stage = getJourneyStage()
  const prev = getPrevJourneyAction(stage)
  const next = getNextActionStatus({
    authenticated: isAuthenticated(),
    hasProfile: hasUserProfile(),
    role: getUserRole(),
    stage,
    hasDiagnosisDraft: hasDiagnosisDraft(),
  })

  return (
    <section className="journey-action-bar" aria-label="단계 이동 액션">
      {prev ? (
        <Link className="secondary-btn link-btn" to={withJourneyFrom(prev.to, location.pathname)}>
          {prev.label}
        </Link>
      ) : (
        <span className="hint-text">현재 시작 단계입니다.</span>
      )}

      {next.enabled ? (
        <Link className="primary-btn link-btn" to={withJourneyFrom(next.to, location.pathname)}>
          다음 단계: {next.label}
        </Link>
      ) : (
        <button className="primary-btn" disabled type="button">
          다음 단계 잠금
        </button>
      )}
    </section>
  )
}
