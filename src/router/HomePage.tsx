import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import {
  fetchDiagnosis,
  fetchJourneyStage,
  isForcedApiErrorMode,
  setForcedApiErrorMode,
} from '../shared/api/learningApi'
import { syncAuthSession } from '../shared/api/authApi'
import { getErrorMessage } from '../shared/api/errorMessage'
import { consumeSessionExpiredNotice } from '../shared/auth/sessionSignals'
import { runtimeConfig } from '../shared/config/runtime'
import { AppShell } from '../shared/layouts/AppShell'
import { getFunnelSnapshot, type FunnelSnapshot } from '../shared/observability/funnel'
import { appendAuditLog } from '../shared/observability/audit'
import { canAccessRoute, getRouteAccessDecision } from '../shared/orchestration/access'
import { getGateNoticeFromSearch } from '../shared/orchestration/gateNotice'
import { getNextActionStatus } from '../shared/orchestration/nextAction'
import {
  getHomePrimaryAction,
  getJourneyChecklist,
  getJourneyStartBlockers,
} from '../shared/orchestration/readiness'
import { isAuthenticated, setAuthenticated } from '../shared/state/auth'
import {
  clearUserProfile,
  getUserProfile,
  hasUserProfile,
  saveUserProfile,
} from '../shared/state/profile'
import { getUserRole, setUserRole, type UserRole } from '../shared/state/session'
import {
  clearJourneyData,
  getJourneyStage,
  type DiagnosisPayload,
  type JourneyStage,
} from '../shared/state/learningFlow'
import { featureRoutes } from './routeConfig'
import { clearDiagnosisDraft, hasDiagnosisDraft } from '../features/diagnosis/draftStorage'
import { SkillGapPanel } from '../shared/components/SkillGapPanel'

export function HomePage() {
  const location = useLocation()
  const navigate = useNavigate()
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
    dropOffAfterDiagnosis: 0,
    dropOffAfterSelection: 0,
  })
  const [employeeId, setEmployeeId] = useState('')
  const [name, setName] = useState('')
  const [organization, setOrganization] = useState('')
  const [onboardingError, setOnboardingError] = useState<string | null>(null)
  const [profileReady, setProfileReady] = useState(false)
  const [sessionNotice, setSessionNotice] = useState<string | null>(null)
  const [gateNotice, setGateNotice] = useState<string | null>(null)
  const [gateNextPath, setGateNextPath] = useState<string | null>(null)
  const [authenticated, setAuthenticatedState] = useState(false)
  const [diagnosisDraft, setDiagnosisDraft] = useState(false)
  const debugEnabled =
    runtimeConfig.debugTools || new URLSearchParams(location.search).get('debug') === '1'

  useEffect(() => {
    if (consumeSessionExpiredNotice()) {
      setSessionNotice('세션이 만료되었습니다. 다시 로그인 후 이용해 주세요.')
    }

    const run = async () => {
      try {
        setLoadError(null)
        setLoading(true)
        await syncAuthSession()
        setDiagnosis(await fetchDiagnosis())
        setStage(await fetchJourneyStage())
        setFunnel(getFunnelSnapshot())
        setRole(getUserRole())
        setApiErrorMode(isForcedApiErrorMode())
        setAuthenticatedState(isAuthenticated())
        setDiagnosisDraft(hasDiagnosisDraft())
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

  useEffect(() => {
    const gateNotice = getGateNoticeFromSearch(location.search)
    setGateNotice(gateNotice.message)
    setGateNextPath(gateNotice.nextPath)
  }, [location.search])
  const nextAction = getNextActionStatus({
    authenticated,
    hasProfile: profileReady,
    role,
    stage,
    hasDiagnosisDraft: diagnosisDraft,
  })
  const blockers = getJourneyStartBlockers({
    authenticated,
    hasProfile: profileReady,
  })
  const checklist = getJourneyChecklist({
    authenticated,
    hasProfile: profileReady,
    stage,
  })
  const primaryAction = getHomePrimaryAction({
    authenticated,
    hasProfile: profileReady,
    stage,
    hasDiagnosisDraft: diagnosisDraft,
  })
  const canStartNext = blockers.length === 0 && nextAction.enabled
  const diagnosisRoute = featureRoutes.find((route) => route.path === '/diagnosis')
  const recommendationRoute = featureRoutes.find((route) => route.path === '/recommendation')
  const historyRoute = featureRoutes.find((route) => route.path === '/history')
  const courseLinkingRoute = featureRoutes.find((route) => route.path === '/course-linking')
  const canGoDiagnosis =
    diagnosisRoute &&
    canAccessRoute(diagnosisRoute, {
      authenticated,
      hasProfile: profileReady,
      role,
      stage,
    })
  const canGoRecommendation =
    recommendationRoute &&
    canAccessRoute(recommendationRoute, {
      authenticated,
      hasProfile: profileReady,
      role,
      stage,
    })
  const canGoEnrollment =
    courseLinkingRoute &&
    canAccessRoute(courseLinkingRoute, {
      authenticated,
      hasProfile: profileReady,
      role,
      stage,
    })
  const canGoHistory =
    historyRoute &&
    canAccessRoute(historyRoute, {
      authenticated,
      hasProfile: profileReady,
      role,
      stage,
    })
  const canResumeDiagnosis = Boolean(canGoDiagnosis) && stage === 'start' && diagnosisDraft
  const canOpenHistory =
    historyRoute &&
    canAccessRoute(historyRoute, {
      authenticated,
      hasProfile: profileReady,
      role,
      stage,
    })
  const canOpenCourseLinking =
    courseLinkingRoute &&
    canAccessRoute(courseLinkingRoute, {
      authenticated,
      hasProfile: profileReady,
      role,
      stage,
    })

  const resetJourney = () => {
    appendAuditLog('journey_reset', '사용자 수동 초기화')
    clearJourneyData()
    clearDiagnosisDraft()
    clearUserProfile()
    window.location.reload()
  }

  const changeRole = (nextRole: UserRole) => {
    setUserRole(nextRole)
    setRole(nextRole)
    appendAuditLog('role_changed', `역할 변경: ${nextRole}`)
  }

  const toggleApiErrorMode = () => {
    const next = !apiErrorMode
    setForcedApiErrorMode(next)
    setApiErrorMode(next)
    window.location.reload()
  }

  const submitOnboarding = () => {
    if (!authenticated) {
      setOnboardingError('로그인 후 프로필을 저장해 주세요.')
      return false
    }
    if (!employeeId.trim() || !name.trim() || !organization.trim()) {
      setOnboardingError('사번, 이름, 소속을 모두 입력해 주세요.')
      return false
    }
    saveUserProfile({
      employeeId: employeeId.trim(),
      name: name.trim(),
      organization: organization.trim(),
    })
    appendAuditLog('profile_saved', `프로필 저장: ${employeeId.trim()}`)
    setProfileReady(true)
    setOnboardingError(null)
    return true
  }

  const startLogin = () => {
    if (runtimeConfig.apiMode === 'remote' && runtimeConfig.ssoLoginUrl) {
      appendAuditLog('login', '원격 SSO 로그인 이동')
      try {
        const callback = runtimeConfig.ssoCallbackUrl.startsWith('http')
          ? runtimeConfig.ssoCallbackUrl
          : `${window.location.origin}${runtimeConfig.ssoCallbackUrl}`
        const login = new URL(runtimeConfig.ssoLoginUrl)
        if (!login.searchParams.get('redirect_uri')) {
          login.searchParams.set('redirect_uri', callback)
        }
        window.location.href = login.toString()
      } catch {
        window.location.href = runtimeConfig.ssoLoginUrl
      }
      return 'redirected' as const
    }
    setAuthenticated(true)
    setAuthenticatedState(true)
    setOnboardingError(null)
    appendAuditLog('login', 'mock 로그인 완료')
    return 'local-success' as const
  }

  const moveToBestNextStep = (context: {
    authenticated: boolean
    hasProfile: boolean
    stage: JourneyStage
  }) => {
    const liveContext = {
      authenticated: isAuthenticated() || context.authenticated,
      hasProfile: hasUserProfile() || context.hasProfile,
      role: getUserRole(),
      stage: getJourneyStage() ?? context.stage,
    }
    const routeContext = {
      authenticated: liveContext.authenticated,
      hasProfile: liveContext.hasProfile,
      role: liveContext.role,
      stage: liveContext.stage,
    }
    if (gateNextPath) {
      const gateRoute = featureRoutes.find((route) => route.path === gateNextPath)
      if (!gateRoute) {
        navigate(gateNextPath)
        return
      }
      const decision = getRouteAccessDecision(gateRoute, routeContext)
      if (decision.allowed) {
        navigate(gateNextPath)
        return
      }
      if (decision.nextPath) {
        navigate(decision.nextPath)
        return
      }
    }
    const next = getNextActionStatus({
      authenticated: liveContext.authenticated,
      hasProfile: liveContext.hasProfile,
      role: liveContext.role,
      stage: liveContext.stage,
      hasDiagnosisDraft: hasDiagnosisDraft(),
    })
    if (next.enabled) {
      navigate(next.to)
    }
  }

  const runPrimaryAction = () => {
    if (primaryAction.kind === 'login') {
      const result = startLogin()
      if (result === 'local-success' && profileReady) {
        moveToBestNextStep({ authenticated: true, hasProfile: true, stage })
      }
      return
    }
    if (primaryAction.kind === 'save-profile') {
      const saved = submitOnboarding()
      if (saved) {
        moveToBestNextStep({ authenticated: true, hasProfile: true, stage })
      }
      return
    }
    if (!nextAction.enabled) {
      setOnboardingError(nextAction.reason ?? '현재 단계에서는 이동할 수 없습니다.')
      return
    }
    moveToBestNextStep({
      authenticated,
      hasProfile: profileReady,
      stage,
    })
  }

  return (
    <AppShell
      title="온러닝서처"
      description="역량 진단부터 추천 학습 신청까지 한 번에 이어지는 학습 여정을 제공합니다."
    >
      <section className="hero-card">
        <h2>학습 여정 시작</h2>
        {gateNotice && <p className="error-text">{gateNotice}</p>}
        {sessionNotice && <p className="error-text">{sessionNotice}</p>}
        {loadError && <p className="error-text">{loadError}</p>}
        {loading && <p className="hint-text">로딩 중...</p>}
        <p>
          1) 역량 진단을 완료하면 2) 맞춤 과정 추천이 생성되고, 3) 바로 교육 신청까지
          연결됩니다.
        </p>
        <div className="journey-actions">
          <button className="primary-btn" onClick={runPrimaryAction} type="button">
            {canStartNext ? `바로 시작: ${primaryAction.label}` : primaryAction.label}
          </button>
          <button
            className="secondary-btn"
            disabled={!nextAction.enabled}
            onClick={() =>
              moveToBestNextStep({
                authenticated,
                hasProfile: profileReady,
                stage,
              })
            }
            type="button"
          >
            현재 단계 이어서 진행
          </button>
          {debugEnabled && (
            <button className="secondary-btn" onClick={resetJourney} type="button">
              데모 데이터 초기화
            </button>
          )}
          {debugEnabled && (
            <button className="secondary-btn" onClick={toggleApiErrorMode} type="button">
              API 오류 모드: {apiErrorMode ? 'ON' : 'OFF'}
            </button>
          )}
          {canResumeDiagnosis && (
            <button className="secondary-btn" onClick={() => navigate('/diagnosis')} type="button">
              미완료 진단 이어하기
            </button>
          )}
        </div>
        {onboardingError && <p className="error-text">{onboardingError}</p>}
        {!profileReady && (
          <p className="hint-text">진단 시작 전 기본 프로필을 먼저 저장해 주세요.</p>
        )}
        {blockers.length > 0 && <p className="hint-text">진입 조건: {blockers.join(' / ')}</p>}
        {nextAction.reason && <p className="hint-text">{nextAction.reason}</p>}
        {canResumeDiagnosis && (
          <p className="hint-text">이전에 진행하던 진단 응답이 저장되어 있습니다. 이어서 완료할 수 있습니다.</p>
        )}
        {gateNextPath && (
          <div className="journey-actions">
            <button
              className="secondary-btn"
              onClick={() =>
                moveToBestNextStep({
                  authenticated,
                  hasProfile: profileReady,
                  stage,
                })
              }
              type="button"
            >
              권장 페이지로 이동
            </button>
          </div>
        )}
        <p className="hint-text">인증 상태: {authenticated ? '로그인됨' : '로그인 필요'}</p>
        <p className="hint-text">현재 단계: {stage}</p>
        {debugEnabled && <p className="hint-text">현재 역할: {role}</p>}
        <p className="hint-text">API 모드: {runtimeConfig.apiMode}</p>
        <ul className="checklist">
          {checklist.map((item) => (
            <li className={item.done ? 'done' : 'todo'} key={item.label}>
              {item.done ? '완료' : '대기'} - {item.label}
            </li>
          ))}
        </ul>
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
        {debugEnabled && (
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
        )}
      </section>

      <section className="feature-grid">
        <article className="feature-card">
          <h3>1단계: 로그인/프로필</h3>
          <p>{authenticated ? '로그인 완료' : '로그인이 필요합니다.'}</p>
          <p>{profileReady ? '프로필 저장 완료' : '프로필 저장이 필요합니다.'}</p>
          <div className="journey-actions">
            <button className="secondary-btn" onClick={startLogin} type="button">
              {authenticated ? '로그인 상태 확인' : '로그인'}
            </button>
            <button className="secondary-btn" onClick={submitOnboarding} type="button">
              {profileReady ? '프로필 수정' : '프로필 저장'}
            </button>
          </div>
        </article>

        <article className="feature-card">
          <h3>2단계: 역량 진단</h3>
          <p>설문 완료 후 개인 역량 갭을 계산합니다.</p>
          <button
            className="primary-btn"
            disabled={!canGoDiagnosis}
            onClick={() => navigate('/diagnosis')}
            type="button"
          >
            진단 시작
          </button>
        </article>

        <article className="feature-card">
          <h3>3단계: 맞춤 추천</h3>
          <p>진단 결과 기반 추천과정과 추천 이유를 확인합니다.</p>
          <button
            className="primary-btn"
            disabled={!canGoRecommendation}
            onClick={() => navigate('/recommendation')}
            type="button"
          >
            추천 확인
          </button>
        </article>

        <article className="feature-card">
          <h3>4단계: 신청/이력</h3>
          <p>추천 과정을 신청하고 결과를 이력에서 추적합니다.</p>
          <div className="journey-actions">
            <button
              className="primary-btn"
              disabled={!canGoEnrollment}
              onClick={() => navigate('/course-linking')}
              type="button"
            >
              신청 진행
            </button>
            <button
              className="secondary-btn"
              disabled={!canGoHistory}
              onClick={() => navigate('/history')}
              type="button"
            >
              이력 보기
            </button>
          </div>
        </article>
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
          {canOpenHistory ? <Link to="/history">학습 이력 확인</Link> : <span>이력은 진단 완료 후 확인 가능합니다.</span>}
        </article>

        <article className="feature-card">
          <h3>추천 학습 흐름</h3>
          <p>진단 결과의 역량 갭을 기준으로 추천 과정과 신청 버튼을 제공합니다.</p>
          {canOpenCourseLinking ? (
            <Link to="/course-linking">신청 연동 페이지</Link>
          ) : (
            <span>추천 과정 선택 후 신청 연동이 활성화됩니다.</span>
          )}
        </article>

        <article className="feature-card">
          <h3>운영 퍼널 요약</h3>
          <p>진단 완료: {funnel.diagnosisCompleted}</p>
          <p>과정 선택: {funnel.courseSelected} ({funnel.conversionToSelection}%)</p>
          <p>신청 완료: {funnel.enrollmentCompleted} ({funnel.conversionToEnrollment}%)</p>
          <p>드롭오프(진단→선택): {funnel.dropOffAfterDiagnosis}</p>
          <p>드롭오프(선택→신청): {funnel.dropOffAfterSelection}</p>
          <Link to="/history">상세 이력 보기</Link>
        </article>
      </section>

      {diagnosis && <SkillGapPanel diagnosis={diagnosis} title="현재 역량 갭 대시보드" />}
    </AppShell>
  )
}
