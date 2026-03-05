import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AppShell } from '../../../shared/layouts/AppShell'
import { saveDiagnosisPayload } from '../../../shared/state/learningFlow'

type Question = {
  id: string
  text: string
  category: 'digital' | 'leadership' | 'collaboration' | 'problemSolving'
}

const questions: Question[] = [
  { id: 'q1', text: '디지털 도구를 빠르게 익혀 업무에 적용한다.', category: 'digital' },
  { id: 'q2', text: '데이터 기반으로 업무 우선순위를 정한다.', category: 'digital' },
  { id: 'q3', text: '팀 목표를 명확히 전달하고 실행을 이끈다.', category: 'leadership' },
  { id: 'q4', text: '협업 시 상대 부서 입장을 반영해 조율한다.', category: 'collaboration' },
  { id: 'q5', text: '문제 원인을 구조적으로 분석해 해결안을 만든다.', category: 'problemSolving' },
]

export function DiagnosisPage() {
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})

  const current = questions[index]
  const done = index >= questions.length

  const progress = Math.round((Object.keys(answers).length / questions.length) * 100)

  const categoryScores = useMemo(() => {
    return questions.reduce(
      (acc, q) => {
        acc[q.category] += answers[q.id] ?? 0
        return acc
      },
      { digital: 0, leadership: 0, collaboration: 0, problemSolving: 0 },
    )
  }, [answers])

  const totalScore = Object.values(answers).reduce((sum, val) => sum + val, 0)

  const topGaps = useMemo(() => {
    const pairs = Object.entries(categoryScores).sort((a, b) => a[1] - b[1])
    return pairs.slice(0, 2).map(([key]) => key)
  }, [categoryScores])

  const choose = (value: number) => {
    setAnswers((prev) => ({ ...prev, [current.id]: value }))
  }

  const next = () => {
    if (!done) setIndex((prev) => prev + 1)
  }

  const prev = () => {
    if (index > 0) setIndex((prev) => prev - 1)
  }

  const goRecommendation = () => {
    saveDiagnosisPayload({
      userId: 'employee-demo',
      diagnosedAt: new Date().toISOString(),
      totalScore,
      maxScore: questions.length * 2,
      categoryScores,
      topGaps,
    })
    navigate('/recommendation')
  }

  return (
    <AppShell
      title="AI 역량 진단"
      description="질문 응답 결과를 기반으로 추천 과정 페이지로 연결됩니다."
    >
      <section className="hero-card diagnosis-progress-card">
        <div className="progress-row">
          <strong>진행률 {progress}%</strong>
          <span>
            {Object.keys(answers).length}/{questions.length}
          </span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </section>

      {!done && (
        <section className="hero-card">
          <p className="question-step">
            문항 {index + 1}/{questions.length}
          </p>
          <h2>{current.text}</h2>
          <div className="answer-options">
            <button className="answer-btn" onClick={() => choose(0)} type="button">
              아니오
            </button>
            <button className="answer-btn" onClick={() => choose(1)} type="button">
              보통
            </button>
            <button className="answer-btn" onClick={() => choose(2)} type="button">
              예
            </button>
          </div>

          <div className="diagnosis-actions">
            <button className="secondary-btn" disabled={index === 0} onClick={prev} type="button">
              이전
            </button>
            <button
              className="primary-btn"
              disabled={answers[current.id] === undefined}
              onClick={next}
              type="button"
            >
              {index === questions.length - 1 ? '결과 보기' : '다음'}
            </button>
          </div>
        </section>
      )}

      {done && (
        <section className="hero-card">
          <h2>진단 결과</h2>
          <p>
            총점 {totalScore}/{questions.length * 2}
          </p>
          <p>보완 우선 역량: {topGaps.join(', ')}</p>
          <button className="primary-btn" onClick={goRecommendation} type="button">
            추천 과정 보기
          </button>
        </section>
      )}
    </AppShell>
  )
}
