import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getNextJourneyAction, stageOrder } from '../orchestration/journey'
import {
  getJourneyStage,
  subscribeJourneyUpdates,
  type JourneyStage,
} from '../state/learningFlow'

const stages: Array<{ key: JourneyStage; label: string }> = stageOrder.map((key) => ({
  key,
  label:
    key === 'start'
      ? '시작'
      : key === 'diagnosis_done'
        ? '진단 완료'
        : key === 'course_selected'
          ? '과정 선택'
          : '신청 완료',
}))

export function JourneyProgressPanel() {
  const [stage, setStage] = useState<JourneyStage>(() => getJourneyStage())

  useEffect(() => {
    const sync = () => setStage(getJourneyStage())
    return subscribeJourneyUpdates(sync)
  }, [])

  const currentIndex = stages.findIndex((item) => item.key === stage)
  const nextAction = getNextJourneyAction(stage)

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
