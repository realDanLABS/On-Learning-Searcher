'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { syncAuthSession } from '@/lib/auth-client'
import {
  buildSummary,
  clearDiagnosisDraft,
  diagnosisQuestions,
  getTopGapLabel,
  loadDiagnosisDraft,
  saveDiagnosisDraft,
  type AnswerMap,
  type ChoiceValue,
} from '@/lib/diagnosis'
import { submitDiagnosis, type CompetencyAreaKey } from '@/lib/learning-client'
import { clearIdentity, getDisplayUser, RECOMMENDED_COURSE_PREVIEW_COUNT } from '@/lib/stitch-ui'
import { UserTopNav } from '@/components/user-top-nav'

const optionDescriptions: Record<number, string> = {
  1: '업무에 적용한 경험이 없거나 관련 도구를 잘 모릅니다.',
  2: '시간적 여유가 있을 때 가끔 업무에 적용해 봅니다.',
  3: '대부분의 작업에 적용하며, 적극적으로 효율적인 방법을 찾습니다.',
  4: '항상 적용합니다. 자동화는 내 업무 프로세스의 핵심입니다.',
}

export function DiagnosisScreen() {
  const router = useRouter()
  const [session, setSession] = useState<Awaited<ReturnType<typeof syncAuthSession>> | null>(null)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [submitting, setSubmitting] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [userId, setUserId] = useState('')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [savedMessage, setSavedMessage] = useState('')

  useEffect(() => {
    const timer = window.setInterval(() => setElapsedSeconds((prev) => prev + 1), 1000)
    const draft = loadDiagnosisDraft()
    setAnswers(draft)
    const firstUnansweredIndex = diagnosisQuestions.findIndex((question) => draft[question.id] === undefined)
    setStep(firstUnansweredIndex === -1 ? diagnosisQuestions.length - 1 : firstUnansweredIndex)

    void syncAuthSession()
      .then((currentSession) => {
        setSession(currentSession)
        setAuthenticated(currentSession.authenticated)
        setUserId(currentSession.profile?.employeeId ?? '')
      })
      .catch(() => setSession(null))

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!savedMessage) return
    const timer = window.setTimeout(() => setSavedMessage(''), 1800)
    return () => window.clearTimeout(timer)
  }, [savedMessage])

  const currentQuestion = diagnosisQuestions[step]
  const answeredCount = useMemo(
    () => Object.keys(answers).filter((key) => answers[key] !== undefined).length,
    [answers],
  )
  const progress = Math.round((answeredCount / diagnosisQuestions.length) * 100)
  const summary = useMemo(() => buildSummary(answers), [answers])
  const topGapLabel = useMemo(() => getTopGapLabel(answers), [answers])
  const elapsedTime = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:${String(elapsedSeconds % 60).padStart(2, '0')}`
  const user = getDisplayUser(session?.profile)
  const canGoNext = answers[currentQuestion.id] !== undefined
  const isLast = step === diagnosisQuestions.length - 1

  function handleSelectAnswer(value: ChoiceValue) {
    setAnswers((prev) => {
      const next = { ...prev, [currentQuestion.id]: value }
      return next
    })
  }

  function handleSaveDraft() {
    saveDiagnosisDraft(answers)
    setSavedMessage('임시 저장되었습니다.')
  }

  async function handleSubmit() {
    const topGaps = (Object.entries(summary.categoryScores) as Array<[CompetencyAreaKey, number]>)
      .sort((left, right) => left[1] - right[1])
      .slice(0, RECOMMENDED_COURSE_PREVIEW_COUNT)
      .map(([key]) => key)

    setSubmitting(true)
    try {
      await submitDiagnosis({
        userId,
        diagnosedAt: new Date().toISOString(),
        totalScore: summary.totalScore,
        maxScore: summary.maxScore,
        categoryScores: summary.categoryScores,
        topGaps,
      })
      clearDiagnosisDraft()
      router.push('/diagnosis/results')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitting) {
    return <div className="app-bootstrap-loading">진단 결과를 분석하는 중입니다...</div>
  }

  return (
    <div className="home-react-page diagnosis-react-page">
      <UserTopNav
        activeRoute="/diagnosis"
        authenticated={authenticated}
        loginHref="/login?next=%2Fdiagnosis"
        onLogout={async () => {
          await clearIdentity()
          router.push('/')
        }}
        organization={user.organization}
        role={session?.role}
        signupHref="/signup?next=%2Fdiagnosis"
        userName={user.name}
      />

      <main className="diagnosis-react-main">
        <section className="diagnosis-react-panel diagnosis-react-primary">
          <nav className="diagnosis-react-stepper" aria-label="진단 진행 단계">
            {[
              { label: '준비', done: true, current: false, value: 'check' },
              { label: '문항 응답', done: false, current: true, value: '2' },
              { label: '검토', done: false, current: false, value: '3' },
              { label: '결과 분석', done: false, current: false, value: '4' },
            ].map((item, index) => (
              <div className="diagnosis-react-stepper-item" key={item.label}>
                <div className={`diagnosis-react-stepper-node${item.current ? ' is-current' : ''}${item.done ? ' is-done' : ''}`}>
                  {item.done ? <span className="material-symbols-outlined">check</span> : <span>{item.value}</span>}
                </div>
                <span>{item.label}</span>
                {index < 3 ? <div className={`diagnosis-react-stepper-line${index === 0 ? ' is-done' : ''}`} /> : null}
              </div>
            ))}
          </nav>

          <article className="diagnosis-react-card">
            <div className="diagnosis-react-question-head">
              <span className="diagnosis-react-question-index">문항 {step + 1} / {diagnosisQuestions.length}</span>
              <h1>{currentQuestion.title}</h1>
              <p>기술적 효율성과 디지털 업무 습관을 기준으로 가장 가까운 응답을 선택해 주세요.</p>
            </div>

            <div className="diagnosis-react-options" role="radiogroup" aria-label="진단 응답 선택">
              {currentQuestion.options.map((option) => {
                const selected = answers[currentQuestion.id] === option.value
                return (
                  <label
                    className={`diagnosis-react-option${selected ? ' is-selected' : ''}`}
                    key={`${currentQuestion.id}-${option.value}`}
                  >
                    <input
                      checked={selected}
                      name={`diagnosis-${currentQuestion.id}`}
                      onChange={() => handleSelectAnswer(option.value)}
                      type="radio"
                      value={option.value}
                    />
                    <div>
                      <strong>{option.label}</strong>
                      <span>{optionDescriptions[option.value]}</span>
                    </div>
                  </label>
                )
              })}
            </div>
          </article>

          <div className="diagnosis-react-actions">
            <button
              className="diagnosis-react-secondary"
              disabled={step === 0}
              onClick={() => setStep((prev) => Math.max(0, prev - 1))}
              type="button"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              이전
            </button>

            <div className="diagnosis-react-actions-right">
              <button className="diagnosis-react-ghost" onClick={handleSaveDraft} type="button">
                임시 저장
              </button>
              <button
                className="diagnosis-react-primary-button"
                disabled={!canGoNext}
                onClick={() => {
                  if (!canGoNext) return
                  if (isLast) {
                    void handleSubmit()
                    return
                  }
                  setStep((prev) => Math.min(diagnosisQuestions.length - 1, prev + 1))
                }}
                type="button"
              >
                <span>{isLast ? '결과 보기' : '다음 문항'}</span>
                {!isLast ? <span className="material-symbols-outlined">arrow_forward</span> : null}
              </button>
            </div>
          </div>
        </section>

        <aside className="diagnosis-react-sidebar">
          <section className="diagnosis-react-panel">
            <div className="diagnosis-react-sidebar-head">
              <span className="material-symbols-outlined">analytics</span>
              <h2>응답 현황</h2>
            </div>

            <div className="diagnosis-react-progress">
              <div className="diagnosis-react-progress-head">
                <span>전체 진행률</span>
                <strong>{progress}%</strong>
              </div>
              <div className="diagnosis-react-progress-track">
                <div className="diagnosis-react-progress-bar" style={{ width: `${progress}%` }} />
              </div>
              <p>{diagnosisQuestions.length}문항 중 {answeredCount}문항 응답 완료</p>
            </div>

            <div className="diagnosis-react-highlight">
              <div className="diagnosis-react-highlight-icon">
                <span className="material-symbols-outlined">priority_high</span>
              </div>
              <div>
                <small>진단 영역</small>
                <strong>{topGapLabel}</strong>
              </div>
            </div>
          </section>

          <section className="diagnosis-react-tip">
            <div className="diagnosis-react-sidebar-head">
              <span className="material-symbols-outlined">lightbulb</span>
              <h2>도움말</h2>
            </div>
            <p>너무 깊게 고민하지 마세요. 첫 번째 직감이 현재 업무 습관을 가장 잘 반영하는 경우가 많습니다.</p>
          </section>

          <section className="diagnosis-react-visual">
            <div>
              <small>진행 시간</small>
              <strong>{elapsedTime}</strong>
            </div>
            <div>
              <small>저장 상태</small>
              <strong>{savedMessage || '실시간 작성 중'}</strong>
            </div>
            <div>
              <small>예상 단계</small>
              <strong>{summary.level}</strong>
            </div>
          </section>
        </aside>
      </main>
    </div>
  )
}
