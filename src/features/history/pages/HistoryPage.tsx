import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import {
  fetchDiagnosis,
  fetchEnrollmentHistory,
  fetchJourneyEvents,
} from '../../../shared/api/learningApi'
import { getErrorMessage } from '../../../shared/api/errorMessage'
import { ApiErrorMessage } from '../../../shared/components/ApiErrorMessage'
import { AppShell } from '../../../shared/layouts/AppShell'
import { appendAuditLog, getAuditLogs, type AuditRecord } from '../../../shared/observability/audit'
import { getWeeklyConversionSeries, type WeeklyConversionPoint } from '../../../shared/observability/funnel'
import { getHandoffMessage } from '../../../shared/orchestration/handoff'
import { clearPendingNextPath } from '../../../shared/orchestration/intent'
import { getUserRole } from '../../../shared/state/session'
import {
  clearJourneyData,
  type DiagnosisPayload,
  type EnrollmentRecord,
  type JourneyEvent,
} from '../../../shared/state/learningFlow'
import { clearDiagnosisDraft } from '../../diagnosis/draftStorage'

export function HistoryPage() {
  const location = useLocation()
  const [diagnosis, setDiagnosis] = useState<DiagnosisPayload | null>(null)
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([])
  const [events, setEvents] = useState<JourneyEvent[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([])
  const [weeklySeries, setWeeklySeries] = useState<WeeklyConversionPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const role = getUserRole()
  const canViewManagerSummary = role === 'manager' || role === 'admin'
  const handoff = getHandoffMessage(location.search, 'history')

  const loadData = async () => {
    try {
      setLoadError(null)
      setLoading(true)
      setDiagnosis(await fetchDiagnosis())
      setEnrollments(await fetchEnrollmentHistory())
      setEvents(await fetchJourneyEvents())
      setAuditLogs(getAuditLogs().slice(0, 12))
      setWeeklySeries(getWeeklyConversionSeries(7))
    } catch (error) {
      setLoadError(getErrorMessage(error, '이력 데이터를 불러오지 못했습니다. 다시 시도해 주세요.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const managerSummary = useMemo(() => {
    const completed = enrollments.filter((item) => item.enrollmentStatus === 'enrolled').length
    const completionRate = enrollments.length === 0 ? 0 : Math.round((completed / enrollments.length) * 100)
    return { completed, completionRate }
  }, [enrollments])

  const resetJourney = () => {
    appendAuditLog('journey_reset', '이력 페이지에서 여정 재시작')
    clearJourneyData()
    clearDiagnosisDraft()
    clearPendingNextPath()
    window.location.href = '/'
  }

  return (
    <AppShell
      title="진단 결과 및 학습 이력"
      description="진단 결과와 신청 이력을 한 곳에서 추적합니다."
    >
      {loadError && (
        <section className="hero-card">
          <h2>이력 데이터 오류</h2>
          <ApiErrorMessage error={loadError} />
          <button className="primary-btn" onClick={() => void loadData()} type="button">
            다시 시도
          </button>
        </section>
      )}

      {loading && (
        <section className="hero-card">
          <p className="hint-text">이력 데이터를 불러오는 중입니다...</p>
        </section>
      )}

      {handoff && (
        <section className="hero-card">
          <p className={handoff.kind === 'success' ? 'success-text' : 'hint-text'}>{handoff.text}</p>
        </section>
      )}

      <section className="hero-card">
        <h2>진단 스냅샷</h2>
        {diagnosis ? (
          <>
            <p>
              총점 {diagnosis.totalScore}/{diagnosis.maxScore}
            </p>
            <p>보완 우선 역량: {diagnosis.topGaps.join(', ')}</p>
          </>
        ) : (
          <p>
            진단 데이터가 없습니다. <Link to="/diagnosis">진단 시작하기</Link>
          </p>
        )}
      </section>

      <section className="hero-card">
        <h2>신청/수강 이력</h2>
        {enrollments.length === 0 ? (
          <p>
            신청 이력이 없습니다. <Link to="/recommendation">추천 과정 보기</Link>
          </p>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>과정</th>
                <th>신청일</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((item) => (
                <tr key={`${item.courseId}-${item.enrollmentRequestedAt}`}>
                  <td>{item.courseTitle}</td>
                  <td>{new Date(item.enrollmentRequestedAt).toLocaleDateString('ko-KR')}</td>
                  <td>{item.enrollmentStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {canViewManagerSummary ? (
        <section className="hero-card">
          <h2>관리자 요약</h2>
          <p>신청 완료 과정 수: {managerSummary.completed}</p>
          <p>신청 대비 완료율: {managerSummary.completionRate}%</p>
        </section>
      ) : (
        <section className="hero-card">
          <h2>관리자 요약</h2>
          <p>현재 역할에서는 관리자 요약 지표를 볼 수 없습니다.</p>
        </section>
      )}

      <section className="hero-card">
        <h2>학습 여정 타임라인</h2>
        {events.length === 0 ? (
          <p>아직 기록된 이벤트가 없습니다.</p>
        ) : (
          <ul className="timeline-list">
            {events.map((event) => (
              <li key={event.id}>
                <strong>{event.label}</strong>
                <span>{new Date(event.at).toLocaleString('ko-KR')}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="hero-card">
        <h2>다음 액션</h2>
        <div className="journey-actions">
          <Link className="primary-btn link-btn" to="/chatbot">
            AI 상담 이어가기
          </Link>
          <Link className="secondary-btn link-btn" to="/diagnosis">
            다시 진단 시작
          </Link>
          <button className="secondary-btn" onClick={resetJourney} type="button">
            새로운 진단 여정 시작
          </button>
        </div>
      </section>

      <section className="hero-card">
        <h2>감사 로그 (최근 12건)</h2>
        {auditLogs.length === 0 ? (
          <p>기록된 감사 로그가 없습니다.</p>
        ) : (
          <ul className="timeline-list">
            {auditLogs.map((item) => (
              <li key={item.id}>
                <strong>{item.action}</strong>
                <span>
                  {new Date(item.at).toLocaleString('ko-KR')} · {item.detail}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="hero-card">
        <h2>주간 전환 요약 (최근 7일)</h2>
        <table className="history-table">
          <thead>
            <tr>
              <th>날짜</th>
              <th>진단 완료</th>
              <th>신청 완료</th>
            </tr>
          </thead>
          <tbody>
            {weeklySeries.map((row) => (
              <tr key={row.date}>
                <td>{row.date}</td>
                <td>{row.diagnosisCompleted}</td>
                <td>{row.enrollmentCompleted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppShell>
  )
}
