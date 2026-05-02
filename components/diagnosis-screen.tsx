'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { StitchFrame } from '@/components/stitch-frame'
import { UserTopNav } from '@/components/user-top-nav'
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
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    const draft = loadDiagnosisDraft()
    setAnswers(draft)
    const firstUnansweredIndex = diagnosisQuestions.findIndex((question) => draft[question.id] === undefined)
    setStep(firstUnansweredIndex === -1 ? diagnosisQuestions.length - 1 : firstUnansweredIndex)

    void syncAuthSession()
      .then((currentSession) => {
        setSession(currentSession)
        setAuthenticated(currentSession.authenticated)
        setUserId(currentSession.profile?.employeeId ?? '')
        if (!currentSession.authenticated) {
          router.replace('/login?next=%2Fdiagnosis')
        }
      })
      .catch(() => setSession(null))
      .finally(() => setLoading(false))
  }, [router])

  const currentQuestion = diagnosisQuestions[step]
  const answeredCount = useMemo(
    () => Object.keys(answers).filter((key) => answers[key] !== undefined).length,
    [answers],
  )
  const progress = Math.round((answeredCount / diagnosisQuestions.length) * 100)
  const summary = useMemo(() => buildSummary(answers), [answers])
  const topGapLabel = useMemo(() => getTopGapLabel(answers), [answers])
  const user = getDisplayUser(session?.profile)
  const canGoNext = answers[currentQuestion.id] !== undefined
  const isLast = step === diagnosisQuestions.length - 1

  const payload = useMemo(() => ({
    progress,
    answeredCount,
    topGapLabel,
    questionNumber: step + 1,
    totalQuestions: diagnosisQuestions.length,
    isLast,
    question: {
      title: currentQuestion.title,
      subtitle: '기술적 효율성에 관한 현재의 업무 방식과 일상적인 습관을 반영해 보세요.',
      options: currentQuestion.options.map((option) => ({
        label: option.label,
        description: optionDescriptions[option.value],
        selected: answers[currentQuestion.id] === option.value,
        value: option.value,
      })),
    },
  }), [answers, answeredCount, currentQuestion.id, currentQuestion.options, currentQuestion.title, isLast, progress, step, topGapLabel])

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

  async function handleAction(action: string, data: unknown) {
    const payloadData = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
    if (action === 'login') {
      router.push('/login?next=%2Fdiagnosis')
      return
    }
    if (action === 'signup') {
      router.push('/signup?next=%2Fdiagnosis')
      return
    }
    if (action === 'goto') {
      router.push(typeof payloadData.route === 'string' ? payloadData.route : '/')
      return
    }
    if (action === 'notify') {
      window.alert(typeof payloadData.message === 'string' ? payloadData.message : '준비 중인 기능입니다.')
      return
    }
    if (action === 'logout') {
      await clearIdentity()
      router.push('/')
      return
    }
    if (action === 'select-answer') {
      const value = Number(payloadData.value) as ChoiceValue
      if (!Number.isFinite(value)) return
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }))
      return
    }
    if (action === 'prev-question') {
      setStep((prev) => Math.max(0, prev - 1))
      return
    }
    if (action === 'save-draft') {
      saveDiagnosisDraft(answers)
      return
    }
    if (action === 'next-question') {
      if (!canGoNext) return
      if (isLast) {
        await handleSubmit()
        return
      }
      setStep((prev) => Math.min(diagnosisQuestions.length - 1, prev + 1))
    }
  }

  if (submitting) {
    return <div className="app-bootstrap-loading">진단 결과를 분석하는 중입니다...</div>
  }

  if (loading || !authenticated) {
    return <div className="app-bootstrap-loading">로그인 상태를 확인하는 중입니다...</div>
  }

  return (
    <div className="home-react-page">
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
      <StitchFrame file="02-diagnosis.html" hideEmbeddedHeader onAction={handleAction} payload={payload} />
    </div>
  )
}
