import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import {
  fetchSelectedCourse,
  submitEnrollment,
} from '../../../shared/api/learningApi'
import { getErrorMessage } from '../../../shared/api/errorMessage'
import { runtimeConfig } from '../../../shared/config/runtime'
import { AppShell } from '../../../shared/layouts/AppShell'
import { getHandoffMessage } from '../../../shared/orchestration/handoff'
import { resolveBestReachablePath } from '../../../shared/orchestration/smartPath'
import { isAuthenticated } from '../../../shared/state/auth'
import type { EnrollmentRecord, RecommendedCourse } from '../../../shared/state/learningFlow'
import { getJourneyStage } from '../../../shared/state/learningFlow'
import { hasUserProfile } from '../../../shared/state/profile'
import { getUserRole } from '../../../shared/state/session'
import { hasDiagnosisDraft } from '../../diagnosis/draftStorage'
import { buildEcampusApplyUrl, parseEnrollmentCallback } from '../enrollmentCallback'

export function CourseLinkingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [course, setCourse] = useState<RecommendedCourse | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [callbackNotice, setCallbackNotice] = useState<string | null>(null)
  const [callbackFailed, setCallbackFailed] = useState(false)
  const hasCourse = Boolean(course)
  const callbackHandled = useRef(false)
  const handoff = getHandoffMessage(location.search, 'course-linking')

  const loadCourse = async () => {
    try {
      setLoadError(null)
      setLoading(true)
      setCourse(await fetchSelectedCourse())
    } catch (error) {
      setLoadError(getErrorMessage(error, '선택 과정 정보를 불러오지 못했습니다.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCourse()
  }, [])

  useEffect(() => {
    if (!course || callbackHandled.current) return
    const callback = parseEnrollmentCallback(location.search)
    if (!callback.status) return

    callbackHandled.current = true
    const enrollmentStatus = callback.status === 'success' ? 'enrolled' : 'failed'
    const record: EnrollmentRecord = {
      courseId: callback.courseId || course.courseId,
      courseTitle: course.courseTitle,
      enrollmentRequestedAt: new Date().toISOString(),
      enrollmentStatus,
    }

    const run = async () => {
      try {
        await submitEnrollment(record)
        if (enrollmentStatus === 'enrolled') {
          navigate('/history?from=enrollment', { replace: true })
          return
        }
        setCallbackFailed(true)
        setCallbackNotice('외부 신청 결과가 실패로 반환되었습니다. 신청 정보를 다시 확인해 주세요.')
      } catch (error) {
        setLoadError(getErrorMessage(error, '복귀 결과 처리 중 오류가 발생했습니다. 다시 시도해 주세요.'))
      }
    }

    void run()
  }, [course, location.search, navigate])

  const applyUrl = useMemo(() => {
    if (!course || typeof window === 'undefined') return runtimeConfig.ecampusCourseApplyUrl
    const callbackUrl = `${window.location.origin}/course-linking?source=ecampus&courseId=${course.courseId}`
    return buildEcampusApplyUrl(runtimeConfig.ecampusCourseApplyUrl, callbackUrl, course.courseId)
  }, [course])

  const requestEnrollment = async () => {
    if (!course) return

    setCallbackFailed(false)
    setCallbackNotice(null)
    const record: EnrollmentRecord = {
      courseId: course.courseId,
      courseTitle: course.courseTitle,
      enrollmentRequestedAt: new Date().toISOString(),
      enrollmentStatus: 'enrolled',
    }
    try {
      setSubmitting(true)
      await submitEnrollment(record)
      navigate('/history')
    } catch (error) {
      setLoadError(getErrorMessage(error, '신청 처리 중 오류가 발생했습니다. 다시 시도해 주세요.'))
    } finally {
      setSubmitting(false)
    }
  }

  const resetFailedCallback = () => {
    callbackHandled.current = false
    setCallbackFailed(false)
    setCallbackNotice(null)
    navigate('/course-linking?from=recommendation', { replace: true })
  }

  const moveToRecommendedStep = () => {
    const nextPath = resolveBestReachablePath({
      preferredPath: '/recommendation',
      gateNextPath: '/course-linking',
      context: {
        authenticated: isAuthenticated(),
        hasProfile: hasUserProfile(),
        role: getUserRole(),
        stage: getJourneyStage(),
      },
      hasDiagnosisDraft: hasDiagnosisDraft(),
    })
    navigate(nextPath ?? '/recommendation')
  }

  return (
    <AppShell
      title="교육 신청 연동"
      description="추천 과정을 선택하면 신청 후 이력 페이지에서 상태를 확인할 수 있습니다."
    >
      {loadError && (
        <section className="hero-card">
          <h2>오류</h2>
          <p className="error-text">{loadError}</p>
          <button className="secondary-btn" onClick={() => void loadCourse()} type="button">
            다시 시도
          </button>
        </section>
      )}

      {loading && (
        <section className="hero-card">
          <p className="hint-text">과정 정보를 불러오는 중입니다...</p>
        </section>
      )}

      {handoff && (
        <section className="hero-card">
          <p className={handoff.kind === 'success' ? 'success-text' : 'hint-text'}>{handoff.text}</p>
        </section>
      )}

      {!hasCourse && (
        <section className="hero-card">
          <h2>선택된 과정이 없습니다</h2>
          <p>추천 페이지에서 과정을 선택하고 다시 들어와 주세요.</p>
          <div className="journey-actions">
            <button className="primary-btn" onClick={moveToRecommendedStep} type="button">
              권장 단계로 이동
            </button>
            <Link className="secondary-btn link-btn" to="/recommendation">
              추천 페이지로 이동
            </Link>
          </div>
        </section>
      )}

      {hasCourse && course && (
        <section className="hero-card">
          <h2>{course.courseTitle}</h2>
          <p>과정코드: {course.courseId}</p>
          <p>추천근거: {course.reasonTags.join(', ')}</p>
          {callbackNotice && <p className="error-text">{callbackNotice}</p>}
          {callbackFailed && (
            <div className="journey-actions">
              <button className="secondary-btn" onClick={resetFailedCallback} type="button">
                복귀 결과 다시 확인
              </button>
              <Link className="secondary-btn link-btn" to="/recommendation?from=diagnosis">
                추천 페이지로 돌아가기
              </Link>
            </div>
          )}

          <div className="journey-actions">
            <a
              className="secondary-btn link-btn"
              href={applyUrl}
              rel="noreferrer"
              target="_blank"
            >
              이캠퍼스 신청 페이지 열기
            </a>
            <button
              className="primary-btn"
              disabled={submitting}
              onClick={() => void requestEnrollment()}
              type="button"
            >
              {submitting ? '처리 중...' : '신청 완료 처리'}
            </button>
            <Link className="primary-btn link-btn" to="/history">
              이력 확인하기
            </Link>
          </div>
          <p className="hint-text">
            신청 완료 처리 버튼을 누르면 이력 페이지에서 등록 상태를 바로 확인할 수 있습니다.
          </p>
          <p className="hint-text">
            운영 환경에서는 `VITE_ECAMPUS_COURSE_APPLY_URL` 값으로 실제 신청 링크를 연결하고,
            복귀 시 `enrollment=success|failed` 쿼리를 반환하도록 설정하세요.
          </p>
        </section>
      )}
    </AppShell>
  )
}
