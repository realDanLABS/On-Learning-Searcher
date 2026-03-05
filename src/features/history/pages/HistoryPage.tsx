import { Link } from 'react-router-dom'

import { AppShell } from '../../../shared/layouts/AppShell'
import {
  getDiagnosisPayload,
  getEnrollmentRecords,
  getJourneyEvents,
} from '../../../shared/state/learningFlow'

export function HistoryPage() {
  const diagnosis = getDiagnosisPayload()
  const enrollments = getEnrollmentRecords()
  const events = getJourneyEvents()

  return (
    <AppShell
      title="진단 결과 및 학습 이력"
      description="진단 결과와 신청 이력을 한 곳에서 추적합니다."
    >
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
    </AppShell>
  )
}
