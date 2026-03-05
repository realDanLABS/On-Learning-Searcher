import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { fetchDiagnosis, fetchJourneyStage } from '../shared/api/learningApi'
import { AppShell } from '../shared/layouts/AppShell'
import { getFunnelSnapshot, type FunnelSnapshot } from '../shared/observability/funnel'
import { getUserRole, setUserRole, type UserRole } from '../shared/state/session'
import {
  clearJourneyData,
  type DiagnosisPayload,
  type JourneyStage,
} from '../shared/state/learningFlow'

export function HomePage() {
  const [diagnosis, setDiagnosis] = useState<DiagnosisPayload | null>(null)
  const [stage, setStage] = useState<JourneyStage>('start')
  const [role, setRole] = useState<UserRole>('employee')
  const [funnel, setFunnel] = useState<FunnelSnapshot>({
    diagnosisCompleted: 0,
    courseSelected: 0,
    enrollmentCompleted: 0,
    conversionToSelection: 0,
    conversionToEnrollment: 0,
  })

  useEffect(() => {
    const run = async () => {
      setDiagnosis(await fetchDiagnosis())
      setStage(await fetchJourneyStage())
      setFunnel(getFunnelSnapshot())
      setRole(getUserRole())
    }
    void run()
  }, [])
  const nextAction =
    stage === 'start'
      ? { to: '/diagnosis', label: '역량 진단 시작' }
      : stage === 'diagnosis_done'
        ? { to: '/recommendation', label: '추천 과정 확인' }
        : stage === 'course_selected'
          ? { to: '/course-linking', label: '신청 진행하기' }
          : { to: '/history', label: '이력 확인하기' }

  const resetJourney = () => {
    clearJourneyData()
    window.location.reload()
  }

  const changeRole = (nextRole: UserRole) => {
    setUserRole(nextRole)
    setRole(nextRole)
  }

  return (
    <AppShell
      title="온러닝서처"
      description="역량 진단부터 추천 학습 신청까지 한 번에 이어지는 학습 여정을 제공합니다."
    >
      <section className="hero-card">
        <h2>학습 여정 시작</h2>
        <p>
          1) 역량 진단을 완료하면 2) 맞춤 과정 추천이 생성되고, 3) 바로 교육 신청까지
          연결됩니다.
        </p>
        <div className="journey-actions">
          <Link className="primary-btn link-btn" to={nextAction.to}>
            {nextAction.label}
          </Link>
          <Link className="secondary-btn link-btn" to="/recommendation">
            추천 과정 보기
          </Link>
          <button className="secondary-btn" onClick={resetJourney} type="button">
            데모 데이터 초기화
          </button>
        </div>
        <p className="hint-text">현재 단계: {stage}</p>
        <p className="hint-text">현재 역할: {role}</p>
        <div className="journey-actions">
          <button className="secondary-btn" onClick={() => changeRole('employee')} type="button">
            Employee
          </button>
          <button className="secondary-btn" onClick={() => changeRole('manager')} type="button">
            Manager
          </button>
          <button className="secondary-btn" onClick={() => changeRole('admin')} type="button">
            Admin
          </button>
        </div>
      </section>

      <section className="feature-grid">
        <article className="feature-card">
          <h3>현재 진단 상태</h3>
          {diagnosis ? (
            <p>
              총점 {diagnosis.totalScore}/{diagnosis.maxScore}, 최근 진단일{' '}
              {new Date(diagnosis.diagnosedAt).toLocaleDateString('ko-KR')}
            </p>
          ) : (
            <p>아직 진단 결과가 없습니다. 먼저 진단을 시작해 주세요.</p>
          )}
          <Link to="/history">학습 이력 확인</Link>
        </article>

        <article className="feature-card">
          <h3>추천 학습 흐름</h3>
          <p>진단 결과의 역량 갭을 기준으로 추천 과정과 신청 버튼을 제공합니다.</p>
          <Link to="/course-linking">신청 연동 페이지</Link>
        </article>

        <article className="feature-card">
          <h3>운영 퍼널 요약</h3>
          <p>진단 완료: {funnel.diagnosisCompleted}</p>
          <p>과정 선택: {funnel.courseSelected} ({funnel.conversionToSelection}%)</p>
          <p>신청 완료: {funnel.enrollmentCompleted} ({funnel.conversionToEnrollment}%)</p>
          <Link to="/history">상세 이력 보기</Link>
        </article>
      </section>
    </AppShell>
  )
}
