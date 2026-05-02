'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { syncAuthSession } from '@/lib/auth-client'
import {
  fetchDiagnosis,
  fetchEnrollmentHistory,
  fetchRecommendedCourses,
  fetchSelectedCourse,
  selectRecommendedCourse,
  type DiagnosisPayload,
  type EnrollmentRecord,
  type RecommendedCourse,
} from '@/lib/learning-client'
import { SiteFooter } from '@/components/site-footer'
import { buildLearningPathCourses, clearIdentity, formatDurationText, getAreaLabel, getDisplayUser } from '@/lib/stitch-ui'
import { UserTopNav } from '@/components/user-top-nav'

type LearningPathStepView = {
  title: string
  summary: string
  durationText: string
  reason: string
  imageUrl?: string
}

export function LearningPathScreen() {
  const router = useRouter()
  const [session, setSession] = useState<Awaited<ReturnType<typeof syncAuthSession>> | null>(null)
  const [diagnosis, setDiagnosis] = useState<DiagnosisPayload | null>(null)
  const [courses, setCourses] = useState<RecommendedCourse[]>([])
  const [selectedCourse, setSelectedCourse] = useState<RecommendedCourse | null>(null)
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void syncAuthSession()
      .then((session) => {
        setSession(session)
        if (!session.authenticated) {
          router.replace('/login?next=%2Flearning-path')
          return
        }
        return Promise.all([
          fetchDiagnosis().catch(() => null),
          fetchRecommendedCourses('all').catch(() => []),
          fetchSelectedCourse().catch(() => null),
          fetchEnrollmentHistory().catch(() => []),
        ]).then(([diagnosisPayload, recommended, selected, enrollmentHistory]) => {
          setDiagnosis(diagnosisPayload)
          setCourses(recommended)
          setSelectedCourse(selected)
          setEnrollments(enrollmentHistory)
        })
      })
      .finally(() => setLoading(false))
  }, [router])

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('.home-react-reveal'))
    if (!nodes.length) return

    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      nodes.forEach((node) => node.classList.add('is-visible'))
      return
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      })
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 })

    nodes.forEach((node, index) => {
      node.style.transitionDelay = `${Math.min(index * 70, 280)}ms`
      observer.observe(node)
    })

    return () => observer.disconnect()
  }, [loading, diagnosis, courses])

  const pathCourses = useMemo(() => buildLearningPathCourses(courses), [courses])
  const selected = selectedCourse
  const resolvedSteps = pathCourses
  const payload = useMemo(() => ({
    focusArea: getAreaLabel(diagnosis?.topGaps?.[0]) || 'AI 및 자동화',
    startMode: '자기주도형 온라인',
    goal: '업계 전문가 수준',
    steps: resolvedSteps.map((course): LearningPathStepView => ('courseTitle' in course ? {
      title: course.courseTitle,
      summary: course.summary,
      durationText: formatDurationText(course.durationHours),
      reason: course.reason,
      imageUrl: course.imageUrl,
    } : course)),
    stepStates: resolvedSteps.map((course) => {
      if (!('courseId' in course)) return 'pending'
      return enrollments.some((record) => record.courseId === course.courseId && record.enrollmentStatus === 'enrolled')
        ? 'done'
        : 'pending'
    }),
    pathName: selected ? `${getAreaLabel(selected.competencyArea)} 마스터리` : '추천 학습 경로',
    stepCount: resolvedSteps.length,
    totalHours: pathCourses.reduce((sum, course) => sum + course.durationHours, 0),
  }), [diagnosis?.topGaps, enrollments, pathCourses, resolvedSteps, selected])

  const user = getDisplayUser(session?.profile)

  const handleLogout = useCallback(async () => {
    await clearIdentity()
    router.push('/')
  }, [router])

  const handleStepSelect = useCallback(
    async (index: number) => {
      const course = pathCourses[index] ?? selected
      if (course) {
        await selectRecommendedCourse(course)
        router.push('/course-linking')
        return
      }
      router.push('/recommendation')
    },
    [pathCourses, router, selected],
  )

  if (loading) {
    return <div className="app-bootstrap-loading">학습 경로를 구성하는 중입니다...</div>
  }

  if (!diagnosis) {
    router.replace('/diagnosis')
    return <div className="app-bootstrap-loading">역량 진단 화면으로 이동하는 중입니다...</div>
  }

  return (
    <div className="home-react-page learning-react-page">
      <UserTopNav
        activeRoute="/history"
        authenticated={Boolean(session?.authenticated)}
        loginHref="/login?next=%2Flearning-path"
        onLogout={handleLogout}
        organization={user.organization}
        role={session?.role}
        signupHref="/signup?next=%2Flearning-path"
        userName={user.name}
      />

      <main className="learning-react-main">
        <section className="learning-react-title home-react-reveal is-visible">
          <h1>추천 학습 경로</h1>
          <p>
            귀하의 <span>{payload.focusArea}</span> 커리어 목표를 위한 맞춤형 로드맵입니다.
          </p>
        </section>

        <section className="learning-react-summary-grid home-react-reveal is-visible" aria-label="학습 경로 요약">
          {[
            { label: '집중 분야', value: payload.focusArea, icon: 'target' },
            { label: '시작 방식', value: payload.startMode, icon: 'pace' },
            { label: '최종 목표', value: payload.goal, icon: 'flag' },
          ].map((item) => (
            <article className="learning-react-summary-card" key={item.label}>
              <div>
                <span className="material-symbols-outlined">{item.icon}</span>
              </div>
              <section>
                <h3>{item.label}</h3>
                <p>{item.value}</p>
              </section>
            </article>
          ))}
        </section>

        <section className="learning-react-roadmap home-react-reveal">
          {!payload.steps.length ? (
            <article className="learning-react-step pending">
              <div className="learning-react-card muted">
                <div className="learning-react-copy">
                  <div className="learning-react-step-head">
                    <h3>추천 학습 경로가 아직 준비되지 않았습니다.</h3>
                    <span>0시간</span>
                  </div>
                  <p>진단 결과를 바탕으로 추천 과정을 먼저 확인한 뒤 학습 경로를 구성해 주세요.</p>
                  <div className="learning-react-reason">
                    <h4>다음 단계</h4>
                    <p>&quot;추천 과정 페이지에서 과정을 선택하면 개인 학습 경로가 생성됩니다.&quot;</p>
                  </div>
                </div>
              </div>
            </article>
          ) : payload.steps.slice(0, 5).map((step, index) => {
            const state = payload.stepStates[index] === 'done' ? 'done' : 'pending'
            const isLast = index === Math.min(payload.steps.length, 5) - 1
            return (
              <article
                className={`learning-react-step ${state}`}
                key={`${step.title}-${index}`}
                onClick={() => void handleStepSelect(index)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    void handleStepSelect(index)
                  }
                }}
                role="button"
                tabIndex={0}
              >
                {!isLast ? <div className={`learning-react-line ${state}`} /> : null}
                <div className={`learning-react-node ${state}`}>{index + 1}</div>
                <div className={`learning-react-card ${state === 'pending' ? 'muted' : ''}`}>
                  <div className="learning-react-image">
                    <img alt={step.title} src={step.imageUrl || '/brand/logo.png'} />
                    <span />
                  </div>
                  <div className="learning-react-copy">
                    <div className="learning-react-step-head">
                      <h3>{step.title}</h3>
                      <span>{step.durationText}</span>
                    </div>
                    <p>{step.summary}</p>
                    <div className="learning-react-reason">
                      <h4>왜 이 과정이 필요한가요?</h4>
                      <p>&quot;{step.reason}&quot;</p>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
