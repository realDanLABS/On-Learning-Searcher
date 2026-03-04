import { AppShell } from '../../../shared/layouts/AppShell'

export function ChatbotPage() {
  return (
    <AppShell
      title="AI 챗봇 상담"
      description="학습 관련 질의응답과 추천 설명을 제공하는 영역입니다."
    >
      <section className="hero-card">
        <h2>다음 구현 항목</h2>
        <ul>
          <li>채팅 UI(대화 목록 + 입력창)</li>
          <li>대화 컨텍스트 유지</li>
          <li>추천 결과와 연계된 답변 버튼</li>
        </ul>
      </section>
    </AppShell>
  )
}
