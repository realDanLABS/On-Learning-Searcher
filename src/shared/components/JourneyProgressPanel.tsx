import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  getJourneyStage,
  subscribeJourneyUpdates,
  type JourneyStage,
} from '../state/learningFlow'

const stages: Array<{ key: JourneyStage; label: string }> = [
  { key: 'start', label: '시작' },
  { key: 'diagnosis_done', label: '진단 완료' },
  { key: 'course_selected', label: '과정 선택' },
  { key: 'enrollment_done', label: '신청 완료' },
]

function getNextAction(stage: JourneyStage) {
  if (stage === 'start') return { to: '/diagnosis', label: '진단 시작' }
  if (stage === 'diagnosis_done') return { to: '/recommendation', label: '추천 확인' }
  if (stage === 'course_selected') return { to: '/course-linking', label: '신청 진행' }
  return { to: '/history', label: '이력 보기' }
}

export function JourneyProgressPanel() {
  const [stage, setStage] = useState<JourneyStage>(() => getJourneyStage())

  useEffect(() => {
    const sync = () => setStage(getJourneyStage())
    return subscribeJourneyUpdates(sync)
  }, [])

  const currentIndex = stages.findIndex((item) => item.key === stage)
  const nextAction = getNextAction(stage)

  return (
    <section className="journey-progress-panel" aria-label="학습 여정 진행 상황">
      <div className="journey-track">
        {stages.map((item, index) => {
          const status = index < currentIndex ? 'done' : index === currentIndex ? 'active' : 'todo'
          return (
            <div className={`journey-node ${status}`} key={item.key}>
              <span className="dot" />
              <span className="label">{item.label}</span>
            </div>
          )
        })}
      </div>
      <Link className="primary-btn link-btn" to={nextAction.to}>
        다음 단계: {nextAction.label}
      </Link>
    </section>
  )
}
