import { useEffect, useState, type ReactElement } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import { AuthCallbackPage } from '../features/auth/pages/AuthCallbackPage'
import { ChatbotPage } from '../features/chatbot/pages/ChatbotPage'
import { CourseLinkingPage } from '../features/course-linking/pages/CourseLinkingPage'
import { DiagnosisPage } from '../features/diagnosis/pages/DiagnosisPage'
import { HistoryPage } from '../features/history/pages/HistoryPage'
import { RecommendationPage } from '../features/recommendation/pages/RecommendationPage'
import { ResponsivePage } from '../features/responsive/pages/ResponsivePage'
import { fetchJourneyStage } from '../shared/api/learningApi'
import { subscribeSessionExpired } from '../shared/auth/sessionSignals'
import { syncAuthSession } from '../shared/api/authApi'
import { HomePage } from './HomePage'
import { StageGuard } from './StageGuard'

function SessionExpiredWatcher() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    return subscribeSessionExpired(() => {
      if (location.pathname !== '/') {
        navigate('/', { replace: true })
      }
    })
  }, [location.pathname, navigate])

  return null
}

function AppBootstrap({ children }: { children: ReactElement }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const run = async () => {
      try {
        // Ensure deep-link entry has latest auth/profile/stage snapshot before guard checks.
        await syncAuthSession()
        await fetchJourneyStage()
      } catch {
        // Ignore bootstrap errors and let each page render its own guarded error UX.
      } finally {
        setReady(true)
      }
    }
    void run()
  }, [])

  if (!ready) {
    return <div className="app-bootstrap-loading">초기 정보를 불러오는 중입니다...</div>
  }

  return children
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <SessionExpiredWatcher />
      <AppBootstrap>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route
            path="/diagnosis"
            element={
              <StageGuard featureKey="diagnosis" minStage="start">
                <DiagnosisPage />
              </StageGuard>
            }
          />
          <Route
            path="/recommendation"
            element={
              <StageGuard featureKey="recommendation" minStage="diagnosis_done">
                <RecommendationPage />
              </StageGuard>
            }
          />
          <Route
            path="/course-linking"
            element={
              <StageGuard featureKey="course-linking" minStage="course_selected">
                <CourseLinkingPage />
              </StageGuard>
            }
          />
          <Route
            path="/history"
            element={
              <StageGuard featureKey="history" minStage="diagnosis_done">
                <HistoryPage />
              </StageGuard>
            }
          />
          <Route
            path="/chatbot"
            element={
              <StageGuard featureKey="chatbot" minStage="start">
                <ChatbotPage />
              </StageGuard>
            }
          />
          <Route
            path="/responsive"
            element={
              <StageGuard
                allowedRoles={['admin']}
                featureKey="responsive"
                minStage="start"
                requireProfile={false}
              >
                <ResponsivePage />
              </StageGuard>
            }
          />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </AppBootstrap>
    </BrowserRouter>
  )
}
