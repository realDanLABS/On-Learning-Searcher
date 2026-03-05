import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import { AuthCallbackPage } from '../features/auth/pages/AuthCallbackPage'
import { ChatbotPage } from '../features/chatbot/pages/ChatbotPage'
import { CourseLinkingPage } from '../features/course-linking/pages/CourseLinkingPage'
import { DiagnosisPage } from '../features/diagnosis/pages/DiagnosisPage'
import { HistoryPage } from '../features/history/pages/HistoryPage'
import { RecommendationPage } from '../features/recommendation/pages/RecommendationPage'
import { ResponsivePage } from '../features/responsive/pages/ResponsivePage'
import { subscribeSessionExpired } from '../shared/auth/sessionSignals'
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

export function AppRouter() {
  return (
    <BrowserRouter>
      <SessionExpiredWatcher />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route
          path="/diagnosis"
          element={
            <StageGuard minStage="start">
              <DiagnosisPage />
            </StageGuard>
          }
        />
        <Route
          path="/recommendation"
          element={
            <StageGuard minStage="diagnosis_done">
              <RecommendationPage />
            </StageGuard>
          }
        />
        <Route
          path="/course-linking"
          element={
            <StageGuard minStage="course_selected">
              <CourseLinkingPage />
            </StageGuard>
          }
        />
        <Route
          path="/history"
          element={
            <StageGuard minStage="diagnosis_done">
              <HistoryPage />
            </StageGuard>
          }
        />
        <Route
          path="/chatbot"
          element={
            <StageGuard minStage="start">
              <ChatbotPage />
            </StageGuard>
          }
        />
        <Route path="/responsive" element={<ResponsivePage />} />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
