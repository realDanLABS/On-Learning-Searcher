'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { UserTopNav } from '@/components/user-top-nav'
import { competencyAreaLabels } from '@/lib/diagnosis'
import { syncAuthSession } from '@/lib/auth-client'
import {
  fetchDiagnosis,
  fetchDiagnosisHistory,
  fetchRecommendedCourses,
  type CompetencyAreaKey,
  type DiagnosisPayload,
  type RecommendedCourse,
} from '@/lib/learning-client'
import {
  RECOMMENDED_COURSE_PREVIEW_COUNT,
  buildLearningPathCourses,
  clearIdentity,
  getAreaLabel,
  getAreaSubtitle,
  getDiagnosisScoreRate,
} from '@/lib/stitch-ui'

type ResultCategoryView = {
  area: CompetencyAreaKey
  label: string
  subtitle: string
  score: number
  color: string
}

export function DiagnosisResultsScreen({ userId, returnTo }: { userId?: string; returnTo?: string }) {
  const router = useRouter()
  const adminUserId = userId
  const isAdminPreview = Boolean(adminUserId && returnTo)
  const [diagnosis, setDiagnosis] = useState<DiagnosisPayload | null>(null)
  const [history, setHistory] = useState<DiagnosisPayload[]>([])
  const [courses, setCourses] = useState<RecommendedCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Awaited<ReturnType<typeof syncAuthSession>> | null>(null)

  useEffect(() => {
    void syncAuthSession().then(setSession).catch(() => setSession(null))
  }, [])

  useEffect(() => {
    void Promise.all([
      fetchDiagnosis(adminUserId),
      fetchDiagnosisHistory(adminUserId).catch(() => []),
      fetchRecommendedCourses('all', adminUserId).catch(() => []),
    ])
      .then(([diagnosisPayload, diagnosisHistory, recommended]) => {
        setDiagnosis(diagnosisPayload)
        setHistory(diagnosisHistory)
        setCourses(recommended)
      })
      .finally(() => setLoading(false))
  }, [adminUserId])

  const result = useMemo(() => {
    const scoreRate = getDiagnosisScoreRate(diagnosis)
    const previousDiagnosis = diagnosis && history.length > 1
      ? history.find((item) => item.diagnosedAt !== diagnosis.diagnosedAt) ?? null
      : null
    const previousScoreRate = previousDiagnosis ? getDiagnosisScoreRate(previousDiagnosis) : null
    const scoreDelta = previousScoreRate === null ? 0 : scoreRate - previousScoreRate
    const rankedAreas = (Object.entries(diagnosis?.categoryScores ?? {}) as Array<[CompetencyAreaKey, number]>)
      .map(([area, value], index) => ({
        area,
        score: Math.round((Number(value) / 16) * 100) || [64, 71, 79, 86, 68][index],
      }))
      .sort((left, right) => left.score - right.score)
    const previewCourses = buildLearningPathCourses(courses).slice(0, RECOMMENDED_COURSE_PREVIEW_COUNT)
    const strongest = [...rankedAreas].sort((left, right) => right.score - left.score)[0]
    const weakest = rankedAreas[0]
    const primaryNextCourse = previewCourses[0]
    const categories = (Object.keys(competencyAreaLabels) as CompetencyAreaKey[]).slice(0, 4).map((area, index) => ({
      area,
      label: getAreaLabel(area),
      subtitle: getAreaSubtitle(area),
      score: diagnosis ? Math.round((diagnosis.categoryScores[area] / 16) * 100) : [64, 71, 79, 86][index],
      color: ['#00AAD2', '#94A3B8', '#10B981', '#002C5F'][index],
    }))

    return {
      scoreRate: scoreRate || 70,
      scoreDelta,
      improvementArea: getAreaLabel(weakest?.area) || 'AI/자동화',
      strength: getAreaLabel(strongest?.area) || '데이터 의사결정',
      strengthScore: strongest?.score ?? 79,
      nextStep:
        primaryNextCourse?.courseTitle ||
        (weakest?.area === 'aiAutomation' ? 'AI 마스터리' : `${getAreaLabel(weakest?.area)} 집중`),
      categories,
      previewCourses,
    }
  }, [courses, diagnosis, history])

  const adminPreviewLabel = useMemo(() => {
    if (!isAdminPreview) return ''
    const name = diagnosis?.userName?.trim()
    const employeeId = diagnosis?.employeeId?.trim()
    if (name && employeeId) return `${name} / ${employeeId}`
    if (name) return name
    if (employeeId) return employeeId
    return ''
  }, [diagnosis?.employeeId, diagnosis?.userName, isAdminPreview])

  if (loading) {
    return <div className="app-bootstrap-loading">진단 결과 화면을 준비하는 중입니다...</div>
  }

  const profile = session?.profile

  if (!diagnosis && !isAdminPreview) {
    return (
      <div className="home-react-page">
        <UserTopNav
          activeRoute="/diagnosis"
          authenticated={Boolean(session?.authenticated)}
          loginHref="/login?next=%2Fdiagnosis"
          onLogout={async () => {
            await clearIdentity()
            router.push('/')
          }}
          organization={profile?.organization}
          role={session?.role}
          signupHref="/signup?next=%2Fdiagnosis"
          userName={profile?.name}
        />
        <main className="learning-react-main">
          <section className="learning-react-title home-react-reveal is-visible">
            <h1>진단 결과가 아직 없습니다.</h1>
            <p>역량 진단을 먼저 완료해야 결과와 추천 과정을 확인할 수 있습니다.</p>
            <div className="recommendation-react-card-actions" style={{ justifyContent: 'center', marginTop: 24 }}>
              <button onClick={() => router.push('/diagnosis')} type="button">역량 진단하러 가기</button>
            </div>
          </section>
        </main>
      </div>
    )
  }

  const scoreDeltaLabel = result.scoreDelta > 0 ? `+${result.scoreDelta}%` : `${result.scoreDelta}%`

  return (
    <div className="home-react-page diagnosis-results-react-page">
      {isAdminPreview ? (
        <div className="diagnosis-results-react-admin">
          <strong>
            관리자 진단 결과 조회
            {adminPreviewLabel ? <span>{` (${adminPreviewLabel})`}</span> : null}
          </strong>
          <Link className="auth-shell-btn auth-shell-btn-secondary" href={returnTo || '/admin/users'}>
            관리자 페이지로 돌아가기
          </Link>
        </div>
      ) : (
        <UserTopNav
          activeRoute="/diagnosis"
          authenticated={Boolean(session?.authenticated)}
          loginHref="/login?next=%2Fdiagnosis%2Fresults"
          onLogout={async () => {
            await clearIdentity()
            router.push('/')
          }}
          organization={profile?.organization}
          role={session?.role}
          signupHref="/signup?next=%2Fdiagnosis%2Fresults"
          userName={profile?.name}
        />
      )}

      <main className="diagnosis-results-react-main">
        <section className="diagnosis-results-react-hero">
          <div>
            <h1>진단 결과 분석</h1>
            <p>최근 역량 진단을 기준으로 현재 수준과 우선 개선 영역을 정리했습니다. 이 결과를 기준으로 추천 과정과 학습 경로를 이어서 확인할 수 있습니다.</p>
          </div>
          <button
            className="diagnosis-results-react-primary"
            onClick={() => router.push('/recommendation')}
            type="button"
          >
            추천 과정 보기
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </section>

        <section className="diagnosis-results-react-stats" aria-label="진단 결과 요약">
          <article className="diagnosis-results-react-stat">
            <div className="diagnosis-results-react-stat-icon accent">
              <span className="material-symbols-outlined">speed</span>
            </div>
            <div className="diagnosis-results-react-stat-body">
              <span>종합 점수</span>
              <strong>{result.scoreRate}%</strong>
              <small>{scoreDeltaLabel} 변화</small>
            </div>
          </article>
          <article className="diagnosis-results-react-stat">
            <div className="diagnosis-results-react-stat-icon warning">
              <span className="material-symbols-outlined">priority_high</span>
            </div>
            <div className="diagnosis-results-react-stat-body">
              <span>중점 개선 영역</span>
              <strong>{result.improvementArea}</strong>
              <small>즉각적인 집중 필요</small>
            </div>
          </article>
          <article className="diagnosis-results-react-stat">
            <div className="diagnosis-results-react-stat-icon success">
              <span className="material-symbols-outlined">star</span>
            </div>
            <div className="diagnosis-results-react-stat-body">
              <span>핵심 강점</span>
              <strong>{result.strength}</strong>
              <small>{result.strengthScore}% 역량 달성</small>
            </div>
          </article>
          <article className="diagnosis-results-react-stat">
            <div className="diagnosis-results-react-stat-icon navy">
              <span className="material-symbols-outlined">rocket_launch</span>
            </div>
            <div className="diagnosis-results-react-stat-body">
              <span>다음 단계</span>
              <strong>{result.nextStep}</strong>
              <small>우선 추천 과정</small>
            </div>
          </article>
        </section>

        <section className="diagnosis-results-react-panel">
          <div className="diagnosis-results-react-panel-head">
            <h2>
              <span className="material-symbols-outlined">bar_chart</span>
              상세 역량 진단 결과
            </h2>
          </div>
          <div className="diagnosis-results-react-progress-list">
            {result.categories.map((category) => (
              <CategoryProgress key={category.area} category={category} />
            ))}
          </div>
        </section>

        <section className="diagnosis-results-react-bottom">
          <article className="diagnosis-results-react-guide">
            <h3>
              <span className="material-symbols-outlined">lightbulb</span>
              결과 해석 가이드
            </h3>
            <ul>
              <li><strong>0-40%</strong><span>기초 단계. 해당 영역의 우선 교육이 권장됩니다.</span></li>
              <li><strong>41-75%</strong><span>중급 단계. 구체적인 개선 포인트를 잡고 실습을 확대할 시점입니다.</span></li>
              <li><strong>76-100%</strong><span>심화 단계. 멘토링과 현업 확산에 활용할 수 있는 수준입니다.</span></li>
            </ul>
          </article>

          <article className="diagnosis-results-react-next">
            <div>
              <h3>{result.improvementArea} 강화를 위한 다음 단계</h3>
              <p>현재 결과를 기준으로 가장 빠르게 체감 효과를 만들 수 있는 추천 과정을 먼저 시작하는 편이 좋습니다.</p>
            </div>
            <div className="diagnosis-results-react-preview">
              {result.previewCourses.slice(0, 3).map((course, index) => (
                <button
                  className="diagnosis-results-react-preview-item"
                  key={`${course.courseTitle}-${index}`}
                  onClick={() => router.push('/learning-path')}
                  type="button"
                >
                  <strong>{course.courseTitle}</strong>
                  <span>{'reason' in course ? course.reason : '추천 학습 경로에서 확인'}</span>
                </button>
              ))}
            </div>
            <button
              className="diagnosis-results-react-link"
              onClick={() => router.push('/learning-path')}
              type="button"
            >
              학습 경로 살펴보기
            </button>
          </article>
        </section>
      </main>
    </div>
  )
}

function CategoryProgress({ category }: { category: ResultCategoryView }) {
  return (
    <article className="diagnosis-results-react-progress">
      <div className="diagnosis-results-react-progress-head">
        <div>
          <strong>{category.label}</strong>
          <span>{category.subtitle}</span>
        </div>
        <b style={{ color: category.color }}>{category.score}%</b>
      </div>
      <div className="diagnosis-results-react-progress-track">
        <div className="diagnosis-results-react-progress-fill" style={{ width: `${category.score}%`, backgroundColor: category.color }} />
      </div>
    </article>
  )
}
