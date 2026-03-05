import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { ChatbotPage } from '../features/chatbot/pages/ChatbotPage'
import { CourseLinkingPage } from '../features/course-linking/pages/CourseLinkingPage'
import { DiagnosisPage } from '../features/diagnosis/pages/DiagnosisPage'
import { HistoryPage } from '../features/history/pages/HistoryPage'
import { RecommendationPage } from '../features/recommendation/pages/RecommendationPage'
import { ResponsivePage } from '../features/responsive/pages/ResponsivePage'
import { HomePage } from './HomePage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/diagnosis" element={<DiagnosisPage />} />
        <Route path="/recommendation" element={<RecommendationPage />} />
        <Route path="/course-linking" element={<CourseLinkingPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/chatbot" element={<ChatbotPage />} />
        <Route path="/responsive" element={<ResponsivePage />} />
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
