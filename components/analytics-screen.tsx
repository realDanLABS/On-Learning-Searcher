'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { syncAuthSession } from '@/lib/auth-client'
import { fetchDiagnosisHistory, fetchEnrollmentHistory, type DiagnosisPayload, type EnrollmentRecord } from '@/lib/learning-client'
import { clearIdentity, getDisplayUser } from '@/lib/stitch-ui'
import { UserTopNav } from '@/components/user-top-nav'

export function AnalyticsScreen() {
  const router = useRouter()
  const [session, setSession] = useState<Awaited<ReturnType<typeof syncAuthSession>> | null>(null)
  const [history, setHistory] = useState<DiagnosisPayload[]>([])
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void syncAuthSession()
      .then((session) => {
        setSession(session)
        if (!session.authenticated) {
          router.replace('/login?next=%2Fanalytics')
          return
        }
        return Promise.all([fetchDiagnosisHistory().catch(() => []), fetchEnrollmentHistory().catch(() => [])]).then(
          ([diagnosisHistory, enrollmentHistory]) => {
            setHistory(diagnosisHistory)
            setEnrollments(enrollmentHistory)
          },
        )
      })
      .finally(() => setLoading(false))
  }, [router])

  const payload = useMemo(() => {
    const user = getDisplayUser(session?.profile)
    const totalDiagnosed = history.length
    const enrolledCount = enrollments.filter((item) => item.enrollmentStatus === 'enrolled').length
    const failedCount = enrollments.filter((item) => item.enrollmentStatus === 'failed').length
    const needsReview = enrollments.filter((item) => item.enrollmentStatus === 'return-missing').length
    const applicationCount = Math.max(enrolledCount + failedCount + needsReview, 1)

    return {
      totalDiagnosed,
      enrolledCount,
      failedCount,
      needsReview,
      funnel: [
        { label: `진단 완료 (${totalDiagnosed}명)`, percent: totalDiagnosed ? 100 : 0 },
        { label: `추천 확인 (${Math.max(0, totalDiagnosed - failedCount)}명)`, percent: totalDiagnosed ? Math.round(((totalDiagnosed - failedCount) / totalDiagnosed) * 100) : 0 },
        { label: `신청 진행 (${applicationCount}명)`, percent: totalDiagnosed ? Math.round((applicationCount / totalDiagnosed) * 100) : 0 },
        { label: `수강 완료 (${enrolledCount}명)`, percent: totalDiagnosed ? Math.round((enrolledCount / totalDiagnosed) * 100) : 0 },
      ],
      insight: '추천 확인 이후 신청 폼 진입 단계에서 가장 큰 이탈이 발생하고 있습니다. 신청 폼 간소화 또는 모바일 최적화 여부 점검이 권장됩니다.',
      bottlenecks: [
        { tag: '최장 지연', title: '팀장 승인 단계 (평균 4.2일)' },
        { tag: '지연 발생', title: '결제 정보 검증 (평균 1.5일)' },
      ],
      actions: [
        '승인 3일 이상 지연 팀장 대상 리마인드 알림 발송',
        'R&D 센터 부서별 신청 매뉴얼 재배포 (이탈률 높음)',
        `실패 ${failedCount}건에 대한 로그 분석 및 개별 연락 조치`,
      ],
      userName: user.name,
      organization: user.organization,
    }
  }, [enrollments, history, session?.profile])

  if (loading) {
    return <div className="app-bootstrap-loading">운영 분석 데이터를 불러오는 중입니다...</div>
  }

  const user = getDisplayUser(session?.profile)

  return (
    <div className="home-react-page">
      <UserTopNav
        activeRoute="/analytics"
        authenticated={Boolean(session?.authenticated)}
        loginHref="/login?next=%2Fanalytics"
        onLogout={async () => {
          await clearIdentity()
          router.push('/')
        }}
        organization={user.organization}
        role={session?.role}
        signupHref="/signup?next=%2Fanalytics"
        userName={user.name}
      />

      <main className="analytics-react-main">
        <section className="analytics-react-head">
          <div>
            <small>운영 분석</small>
            <h1>학습 여정 병목과 전환 흐름을 확인합니다.</h1>
            <p>{payload.organization} 기준 진단, 신청, 완료 데이터를 단계별로 요약했습니다.</p>
          </div>
        </section>

        <section className="analytics-react-kpis">
          {[
            ['진단 완료', `${payload.totalDiagnosed}명`],
            ['수강 완료', `${payload.enrolledCount}명`],
            ['신청 실패', `${payload.failedCount}건`],
            ['검토 필요', `${payload.needsReview}건`],
          ].map(([label, value]) => (
            <article className="analytics-react-card" key={label}>
              <h2>{label}</h2>
              <strong>{value}</strong>
            </article>
          ))}
        </section>

        <section className="analytics-react-grid">
          <article className="analytics-react-panel">
            <h2>전환 퍼널</h2>
            <div className="analytics-react-funnel">
              {payload.funnel.map((item) => (
                <div className="analytics-react-funnel-row" key={item.label}>
                  <div className="analytics-react-funnel-label">
                    <span>{item.label}</span>
                    <strong>{item.percent}%</strong>
                  </div>
                  <div className="analytics-react-funnel-track">
                    <div className="analytics-react-funnel-bar" style={{ width: `${item.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="analytics-react-panel">
            <h2>주요 인사이트</h2>
            <p>{payload.insight}</p>
            <ul>
              {payload.bottlenecks.map((item) => (
                <li key={item.title}>
                  <small>{item.tag}</small>
                  <strong>{item.title}</strong>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="analytics-react-panel">
          <h2>권장 조치</h2>
          <ul className="analytics-react-actions">
            {payload.actions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}
