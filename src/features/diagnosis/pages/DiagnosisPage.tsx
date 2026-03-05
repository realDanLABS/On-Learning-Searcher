import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { submitDiagnosis } from '../../../shared/api/learningApi'
import { getErrorMessage } from '../../../shared/api/errorMessage'
import { AppShell } from '../../../shared/layouts/AppShell'
import { getUserProfile } from '../../../shared/state/profile'
import { type AnswerMap, buildSummary } from '../diagnosisResult'
import { clearDiagnosisDraft, loadDiagnosisDraft, saveDiagnosisDraft } from '../draftStorage'
import { diagnosisQuestions } from '../questions'

export function DiagnosisPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<AnswerMap>(() => loadDiagnosisDraft())
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    saveDiagnosisDraft(answers)
  }, [answers])

  const currentQuestion = diagnosisQuestions[step]
  const isFinished = step >= diagnosisQuestions.length

  const answeredCount = useMemo(
    () => Object.keys(answers).filter((key) => answers[key] !== undefined).length,
    [answers],
  )

  const progress = Math.round((answeredCount / diagnosisQuestions.length) * 100)
  const summary = useMemo(() => buildSummary(answers), [answers])

  const categoryScores = useMemo(
    () =>
      diagnosisQuestions.reduce(
        (acc, q) => {
          const key = q.category === 'problem-solving' ? 'problemSolving' : q.category
          acc[key] += answers[q.id] ?? 0
          return acc
        },
        { digital: 0, leadership: 0, collaboration: 0, problemSolving: 0 },
      ),
    [answers],
  )

  const topGaps = useMemo(() => {
    return Object.entries(categoryScores)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 2)
      .map(([key]) => key)
  }, [categoryScores])

  const selectAnswer = (value: number) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }))
  }

  const goNext = () => {
    if (step < diagnosisQuestions.length) {
      setStep((prev) => prev + 1)
    }
  }

  const goPrev = () => {
    if (step > 0) {
      setStep((prev) => prev - 1)
    }
  }

  const resetDiagnosis = () => {
    setStep(0)
    setAnswers({})
    clearDiagnosisDraft()
  }

  const moveToRecommendation = async () => {
    const profile = getUserProfile()
    try {
      setSubmitError(null)
      await submitDiagnosis({
        userId: profile?.employeeId ?? 'employee-demo',
        diagnosedAt: new Date().toISOString(),
        totalScore: summary.totalScore,
        maxScore: summary.maxScore,
        categoryScores,
        topGaps,
      })
      clearDiagnosisDraft()
      navigate('/recommendation?from=diagnosis')
    } catch (error) {
      setSubmitError(getErrorMessage(error, '진단 결과 저장 중 오류가 발생했습니다. 다시 시도해 주세요.'))
    }
  }

  const canGoNext = isFinished || answers[currentQuestion.id] !== undefined

  return (
    <AppShell
      title="AI 역량 진단"
      description="10문항 기준의 MVP 진단 플로우입니다. 응답은 브라우저에 임시 저장됩니다."
    >
      <section className="hero-card diagnosis-progress-card">
        <div className="progress-row">
          <strong>진행률 {progress}%</strong>
          <span>
            {answeredCount} / {diagnosisQuestions.length} 답변 완료
          </span>
        </div>
        <div className="progress-track" role="progressbar" aria-valuenow={progress}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </section>

      {!isFinished && (
        <section className="hero-card diagnosis-question-card">
          <p className="question-step">
            문항 {step + 1} / {diagnosisQuestions.length}
          </p>
          <h2>{currentQuestion.title}</h2>
          <div className="answer-options">
            {currentQuestion.options.map((option) => {
              const isActive = answers[currentQuestion.id] === option.value
              return (
                <button
                  className={isActive ? 'answer-btn active' : 'answer-btn'}
                  key={option.label}
                  onClick={() => selectAnswer(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              )
            })}
          </div>

          <div className="diagnosis-actions">
            <button className="secondary-btn" disabled={step === 0} onClick={goPrev} type="button">
              이전
            </button>
            <button className="primary-btn" disabled={!canGoNext} onClick={goNext} type="button">
              {step === diagnosisQuestions.length - 1 ? '결과 보기' : '다음'}
            </button>
          </div>
        </section>
      )}

      {isFinished && (
        <section className="hero-card diagnosis-result-card">
          <h2>진단 결과 요약</h2>
          <p>
            총점 {summary.totalScore} / {summary.maxScore} | 수준: {summary.level}
          </p>
          <p>강점: {summary.strengths.join(', ')}</p>
          <p>집중 성장 영역: {summary.growthArea}</p>
          {submitError && <p className="error-text">{submitError}</p>}

          <div className="diagnosis-actions">
            <button className="secondary-btn" onClick={goPrev} type="button">
              마지막 문항으로
            </button>
            <button className="primary-btn" onClick={moveToRecommendation} type="button">
              추천 과정 보기
            </button>
            <button className="secondary-btn" onClick={resetDiagnosis} type="button">
              처음부터 다시
            </button>
          </div>
        </section>
      )}

      <section className="hero-card">
        <h2>진단 가이드</h2>
        <p>진단 완료 후 추천 과정 선택까지 약 2분 내에 진행할 수 있습니다.</p>
        <div className="journey-actions">
          <Link className="secondary-btn link-btn" to="/history">
            이전 진단/학습 이력 보기
          </Link>
          <Link className="secondary-btn link-btn" to="/chatbot">
            챗봇에게 진단 준비 질문하기
          </Link>
        </div>
      </section>
    </AppShell>
  )
}
