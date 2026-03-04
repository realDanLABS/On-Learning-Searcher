import { AppShell } from '../../../shared/layouts/AppShell'

export function DiagnosisPage() {
  return (
    <AppShell
      title="AI 역량 진단"
      description="OX형/선택형 질문 플로우를 구현할 기본 페이지입니다."
    >
      <section className="hero-card">
        <h2>다음 구현 항목</h2>
        <ul>
          <li>질문 단계(Stepper)와 진행률</li>
          <li>답변 저장 상태 관리</li>
          <li>진단 결과 요약 카드</li>
        </ul>
      </section>
    </AppShell>
  )
}
