'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { StitchFrame } from '@/components/stitch-frame'
import { UserTopNav } from '@/components/user-top-nav'
import { syncAuthSession, type AuthSessionPayload } from '@/lib/auth-client'
import {
  type CompetencyAreaKey,
  fetchDiagnosis,
  fetchEnrollmentHistory,
  fetchRecommendedCourses,
  selectRecommendedCourse,
  type DiagnosisPayload,
  type EnrollmentRecord,
  type RecommendedCourse,
} from '@/lib/learning-client'
import { clearIdentity } from '@/lib/stitch-ui'
import { getDiagnosisScoreRate, RECOMMENDED_COURSE_PREVIEW_COUNT } from '@/lib/stitch-ui'

const growthAreaOrder: Array<{ key: CompetencyAreaKey; label: string }> = [
  { key: 'aiAutomation', label: 'AI 활용' },
  { key: 'dataDecision', label: '데이터 판단' },
  { key: 'dxInnovation', label: 'DX 혁신' },
  { key: 'operationsQualitySafety', label: '품질/안전' },
  { key: 'problemCollaboration', label: '문제 해결' },
]

export function HistoryScreen() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [diagnosis, setDiagnosis] = useState<DiagnosisPayload | null>(null)
  const [recommendedCourses, setRecommendedCourses] = useState<RecommendedCourse[]>([])
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([])
  const [session, setSession] = useState<AuthSessionPayload | null>(null)
  const [elapsedLabel, setElapsedLabel] = useState('00:00:00')

  useEffect(() => {
    void syncAuthSession()
      .then((currentSession) => {
        setSession(currentSession)
        if (!currentSession.authenticated || !currentSession.profile) {
          router.replace('/login?next=%2Fhistory')
          return null
        }
        return Promise.all([
          fetchDiagnosis().catch(() => null),
          fetchRecommendedCourses('all').catch(() => []),
          fetchEnrollmentHistory().catch(() => []),
        ]).then(([diagnosisPayload, recommended, enrollmentHistory]) => {
          setDiagnosis(diagnosisPayload)
          setRecommendedCourses(recommended)
          setEnrollments(enrollmentHistory)
        })
      })
      .finally(() => setLoading(false))
  }, [router])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const startedAt = window.localStorage.getItem('on_learning_session_started_at_v1')
    const update = () => {
      if (!startedAt) {
        setElapsedLabel('00:00:00')
        return
      }
      const started = new Date(startedAt).getTime()
      if (Number.isNaN(started)) {
        setElapsedLabel('00:00:00')
        return
      }
      const seconds = Math.max(0, Math.floor((Date.now() - started) / 1000))
      const hh = String(Math.floor(seconds / 3600)).padStart(2, '0')
      const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
      const ss = String(seconds % 60).padStart(2, '0')
      setElapsedLabel(`${hh}:${mm}:${ss}`)
    }
    update()
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [])

  const latestScore = getDiagnosisScoreRate(diagnosis) || 0
  const profileName = session?.profile?.name?.trim() || '임직원'
  const profileOrg = session?.profile?.organization?.trim() || '회사 구성원'
  const recommendationHistory = recommendedCourses.length
    ? recommendedCourses.slice(0, RECOMMENDED_COURSE_PREVIEW_COUNT).map((course) => {
        const matched = enrollments.find((record) => record.courseId === course.courseId)
        return {
          courseId: course.courseId,
          title: course.courseTitle,
          type: `추천 과정 | ${course.level}`,
          period: `${course.durationHours}시간`,
          status:
            matched?.enrollmentStatus === 'enrolled'
              ? '추천완료'
              : matched?.enrollmentStatus === 'requested'
                ? '신청완료'
                : '추천대기',
          result: `${course.fitScore ?? 50}%`,
        }
      })
    : []
  const currentCourse = recommendationHistory[0]?.title ?? '추천 과정이 아직 없습니다'
  const recommendedCount = recommendationHistory.length
  const recommendedHours = recommendedCourses.length
    ? Number(recommendedCourses.slice(0, RECOMMENDED_COURSE_PREVIEW_COUNT).reduce((sum, course) => sum + course.durationHours, 0).toFixed(1))
    : 0
  const growth = useMemo(() => {
    const items = growthAreaOrder.map(({ key, label }) => {
      const raw = diagnosis?.categoryScores?.[key] ?? 0
      const score = diagnosis ? Math.round((raw / 16) * 100) : 0
      return { label, score, height: Math.max(48, Math.round((score / 100) * 192)), color: 'neutral' }
    })
    items.push({ label: '점수 종합', score: latestScore, height: Math.max(48, Math.round((latestScore / 100) * 192)), color: 'summary' })
    return items
  }, [diagnosis, latestScore])

  async function handleAction(action: string, data: unknown) {
    const payloadData = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
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
    if (action === 'history-course-detail') {
      const courseId = typeof payloadData.courseId === 'string' ? payloadData.courseId : ''
      if (!courseId) return
      const targetCourse = recommendedCourses.find((course) => course.courseId === courseId)
      if (targetCourse) {
        await selectRecommendedCourse(targetCourse)
      }
      router.push('/course-linking')
    }
  }

  if (loading) {
    return <div className="app-bootstrap-loading">학습 이력을 불러오는 중입니다...</div>
  }

  return (
    <div className="home-react-page">
      <UserTopNav
        activeRoute="/history"
        authenticated
        onLogout={async () => {
          await clearIdentity()
          router.push('/')
        }}
        organization={profileOrg}
        rightSlot={(
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>진행 시간</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" }}>{elapsedLabel}</span>
          </div>
        )}
        role={session?.role}
        userName={profileName}
      />
      <StitchFrame
        file="07-history.html"
        hideEmbeddedHeader
        onAction={handleAction}
        payload={{
          userName: profileName,
          latestScore,
          recommendedCount,
          recommendedHours,
          growth,
          currentCourse,
          historyTitle: '학습 추천 과정',
          history: recommendationHistory,
        }}
      />
    </div>
  )
}
