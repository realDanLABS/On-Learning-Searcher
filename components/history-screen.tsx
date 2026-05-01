'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { SiteFooter } from '@/components/site-footer'
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
      .then((session) => {
        setSession(session)
        if (!session.authenticated || !session.profile) {
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
  const growthBars = useMemo(() => {
    const bars = growthAreaOrder.map(({ key, label }) => {
      const raw = diagnosis?.categoryScores?.[key] ?? 0
      const score = diagnosis ? Math.round((raw / 16) * 100) : 0
      return {
        label,
        score,
        summary: false,
        heightPx: Math.max(32, Math.round((score / 100) * 192)),
      }
    })

    bars.push({
      label: '점수 종합',
      score: latestScore,
      summary: true,
      heightPx: Math.max(32, Math.round((latestScore / 100) * 192)),
    })

    return bars
  }, [diagnosis, latestScore])
  const profileName = session?.profile?.name?.trim() || '임직원'
  const profileOrg = session?.profile?.organization?.trim() || '현대위아 구성원'
  const recommendationHistory = recommendedCourses.length
    ? recommendedCourses.slice(0, RECOMMENDED_COURSE_PREVIEW_COUNT).map((course) => {
        const isCompleted = enrollments.some(
          (record) => record.courseId === course.courseId && record.enrollmentStatus === 'enrolled',
        )
        return {
          courseId: course.courseId,
          title: course.courseTitle,
          type: `추천 과정 | ${course.level}`,
          period: `${course.durationHours}시간`,
          status: isCompleted ? '추천완료' : '추천대기',
          result: `${course.fitScore ?? 0}%`,
          statusClass: isCompleted
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
          resultClass: 'text-hyundai-blue text-sm font-bold flex items-center gap-1 hover:underline',
        }
      })
    : []
  const currentCourse = recommendationHistory[0]?.title ?? '추천 과정이 아직 없습니다'
  const recommendedCount = recommendationHistory.length
  const recommendedHours = recommendedCourses.length
    ? Number(recommendedCourses.slice(0, RECOMMENDED_COURSE_PREVIEW_COUNT).reduce((sum, course) => sum + course.durationHours, 0).toFixed(1))
    : 0

  async function handleCourseDetail(courseId?: string) {
    if (!courseId) return
    const targetCourse = recommendedCourses.find((course) => course.courseId === courseId)
    if (targetCourse) {
      await selectRecommendedCourse(targetCourse)
    }
    router.push('/course-linking')
  }

  if (loading) {
    return <div className="app-bootstrap-loading">학습 이력을 불러오는 중입니다...</div>
  }

  return (
    <div className="home-react-page font-display text-slate-900 dark:text-slate-100">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-black tracking-tight mb-2">나의 학습 이력</h2>
            <p className="text-slate-500 dark:text-slate-400">지속적인 성장을 위한 개인 맞춤형 학습 현황입니다.</p>
          </div>
          <button className="flex items-center gap-2 rounded-xl h-11 px-6 bg-hyundai-navy text-white text-sm font-bold transition-all hover:opacity-90" onClick={() => router.push('/learning-path')} type="button">
            <span className="material-symbols-outlined text-[20px]">description</span>
            학습 가이드 보기
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-hyundai-navy/10 flex items-center justify-center text-hyundai-navy">
              <span className="material-symbols-outlined text-3xl">insights</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">최근 진단 결과</p>
              <p className="text-3xl font-black text-hyundai-navy">{latestScore}<span className="text-lg font-bold ml-1 text-slate-400">점</span></p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
              <span className="material-symbols-outlined text-3xl">task_alt</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">추천 과정 수</p>
              <p className="text-3xl font-black">{recommendedCount}<span className="text-lg font-bold ml-1 text-slate-400">개</span></p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined text-3xl">schedule</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">추천 학습 시간</p>
              <p className="text-3xl font-black">{recommendedHours}<span className="text-lg font-bold ml-1 text-slate-400">h</span></p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold mb-1">영역별 점수</h3>
                <p className="text-sm text-slate-500">역량 영역별 현재 점수와 종합 점수입니다.</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-bold uppercase">
                <span className="px-3 py-1.5 bg-white dark:bg-slate-700 rounded-md shadow-sm">영역별 점수</span>
                <span className="px-3 py-1.5 text-slate-400">실데이터 기준</span>
              </div>
            </div>
            <div className="relative h-[240px] w-full">
              <div className="absolute inset-0 flex items-end justify-between px-2">
                {growthBars.map((item) => (
                  <div className="flex flex-col items-center gap-2 flex-1 group" key={item.label}>
                  <div
                    className={`${item.summary ? 'bg-hyundai-blue/20 dark:bg-hyundai-blue/40 group-hover:bg-hyundai-blue' : 'bg-slate-100 dark:bg-slate-700 group-hover:bg-primary/20'} w-4/5 rounded-t-lg transition-all relative`}
                    style={{ height: `${item.heightPx}px` }}
                  >
                      <span
                        className={item.summary ? 'absolute text-[12px] font-black text-hyundai-navy whitespace-nowrap' : 'absolute text-[12px] font-black whitespace-nowrap text-slate-700'}
                        style={{ top: -24, left: '50%', transform: 'translateX(-50%)' }}
                      >
                        {item.score}점
                      </span>
                    </div>
                    <span className={item.summary ? 'text-xs font-bold text-hyundai-blue' : 'text-xs font-bold text-slate-400'}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-hyundai-navy p-8 rounded-2xl shadow-lg shadow-hyundai-navy/20 flex flex-col justify-between text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="material-symbols-outlined text-[120px] rotate-12">auto_awesome</span>
            </div>
            <div className="relative z-10">
              <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-[11px] font-bold mb-4 uppercase tracking-wider">NEXT RECOMMENDED</span>
              <h3 className="text-2xl font-black leading-tight mb-2">현재 이어갈 학습</h3>
              <p className="text-white/80 text-sm leading-relaxed mb-6">
                현대위아 구성원을 위해 선정된
                <br />
                다음 루프 추천 과정입니다.
              </p>
              <div className="bg-white/10 border border-white/20 p-4 rounded-xl mb-6 backdrop-blur-sm">
                <p className="text-[11px] font-medium text-white/60 mb-1">추천 과정명</p>
                <p className="font-bold">{currentCourse}</p>
              </div>
            </div>
            <button className="relative z-10 w-full bg-white text-hyundai-navy rounded-xl h-12 font-bold text-sm flex items-center justify-center gap-2 shadow-xl hover:bg-slate-50 transition-colors" onClick={() => router.push('/recommendation')} type="button">
              다음 학습 과정 추천 받기
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-lg font-bold">학습 추천 과정</h3>
            <button className="text-hyundai-blue text-sm font-bold flex items-center gap-1 hover:underline" onClick={() => router.push('/recommendation')} type="button">
              전체 보기
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">과정명</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">학습시간</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">현재 상태</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">추천 적합도</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recommendationHistory.map((row) => (
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors" key={row.title}>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <button className="text-sm font-bold mb-1 text-left hover:text-hyundai-blue" onClick={() => void handleCourseDetail(row.courseId)} type="button">
                          {row.title}
                        </button>
                        <span className="text-[11px] text-slate-400">{row.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm text-slate-600 dark:text-slate-400">{row.period}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${row.statusClass}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={row.resultClass}>{row.result}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
