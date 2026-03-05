import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  fetchDiagnosis,
  fetchJourneyStage,
  isForcedApiErrorMode,
  setForcedApiErrorMode,
} from '../shared/api/learningApi'
import { getErrorMessage } from '../shared/api/errorMessage'
import { runtimeConfig } from '../shared/config/runtime'
import { AppShell } from '../shared/layouts/AppShell'
import { getFunnelSnapshot, type FunnelSnapshot } from '../shared/observability/funnel'
import { getNextJourneyAction } from '../shared/orchestration/journey'
import {
  clearUserProfile,
  getUserProfile,
  saveUserProfile,
} from '../shared/state/profile'
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
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [apiErrorMode, setApiErrorMode] = useState(false)
  const [funnel, setFunnel] = useState<FunnelSnapshot>({
    diagnosisCompleted: 0,
    courseSelected: 0,
    enrollmentCompleted: 0,
    conversionToSelection: 0,
    conversionToEnrollment: 0,
  })
  const [employeeId, setEmployeeId] = useState('')
  const [name, setName] = useState('')
  const [organization, setOrganization] = useState('')
  const [onboardingError, setOnboardingError] = useState<string | null>(null)
  const [profileReady, setProfileReady] = useState(false)

  useEffect(() => {
    const run = async () => {
      try {
        setLoadError(null)
        setLoading(true)
        setDiagnosis(await fetchDiagnosis())
        setStage(await fetchJourneyStage())
        setFunnel(getFunnelSnapshot())
        setRole(getUserRole())
        setApiErrorMode(isForcedApiErrorMode())
        const profile = getUserProfile()
        if (profile) {
          setEmployeeId(profile.employeeId)
          setName(profile.name)
          setOrganization(profile.organization)
          setProfileReady(true)
        }
      } catch (error) {
        setLoadError(getErrorMessage(error, '홈 데이터를 불러오지 못했습니다. 다시 시도해 주세요.'))
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [])
  const nextAction = getNextJourneyAction(stage)

  const resetJourney = () => {
    clearJourneyData()
    clearUserProfile()
    window.location.reload()
  }

  const changeRole = (nextRole: UserRole) => {
    setUserRole(nextRole)
    setRole(nextRole)
  }

  const toggleApiErrorMode = () => {
    const next = !apiErrorMode
    setForcedApiErrorMode(next)
    setApiErrorMode(next)
    window.location.reload()
  }

  const submitOnboarding = () => {
    if (!employeeId.trim() || !name.trim() || !organization.trim()) {
      setOnboardingError('사번, 이름, 소속을 모두 입력해 주세요.')
      return
    }
    saveUserProfile({
      employeeId: employeeId.trim(),
      name: name.trim(),
      organization: organization.trim(),
    })
    setProfileReady(true)
    setOnboardingError(null)
  }

  return (
    <AppShell
      title="온러닝서처"
      description="역량 진단부터 추천 학습 신청까지 한 번에 이어지는 학습 여정을 제공합니다."
    >
      <section className="hero-card">
        <h2>학습 여정 시작</h2>
        {loadError && <p className="error-text">{loadError}</p>}
        {loading && <p className="hint-text">로딩 중...</p>}
        <p>
          1) 역량 진단을 완료하면 2) 맞춤 과정 추천이 생성되고, 3) 바로 교육 신청까지
          연결됩니다.
        </p>
        <div className="journey-actions">
          <button className="primary-btn" onClick={submitOnboarding} type="button">
            {profileReady ? '프로필 수정 완료' : '프로필 저장'}
          </button>
          <Link
            className="primary-btn link-btn"
            onClick={(event) => {
              if (!profileReady) event.preventDefault()
            }}
            to={nextAction.to}
          >
            {nextAction.label}
          </Link>
          <Link className="secondary-btn link-btn" to="/recommendation">
            추천 과정 보기
          </Link>
          <button className="secondary-btn" onClick={resetJourney} type="button">
            데모 데이터 초기화
          </button>
          <button className="secondary-btn" onClick={toggleApiErrorMode} type="button">
            API 오류 모드: {apiErrorMode ? 'ON' : 'OFF'}
          </button>
        </div>
        {onboardingError && <p className="error-text">{onboardingError}</p>}
        {!profileReady && (
          <p className="hint-text">진단 시작 전 기본 프로필을 먼저 저장해 주세요.</p>
        )}
        <p className="hint-text">현재 단계: {stage}</p>
        <p className="hint-text">현재 역할: {role}</p>
        <p className="hint-text">API 모드: {runtimeConfig.apiMode}</p>
        <div className="onboarding-grid">
          <label>
            사번
            <input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
          </label>
          <label>
            이름
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            소속
            <input value={organization} onChange={(e) => setOrganization(e.target.value)} />
          </label>
        </div>
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
