const checkpoints = [
  { viewport: '1440px', status: 'OK', note: '데스크톱 카드/테이블 3열 확인' },
  { viewport: '1024px', status: 'OK', note: '네비 래핑 및 카드 간격 유지' },
  { viewport: '768px', status: 'CHECK', note: 'CTA 버튼 줄바꿈과 입력창 여백 확인' },
  { viewport: '390px', status: 'CHECK', note: '표 overflow와 폰트 가독성 확인' },
]

export function ResponsiveScreen() {
  return (
    <section className="results-grid">
      <div className="panel results-span-2">
        <p className="eyebrow">Responsive QA</p>
        <h1>반응형 최적화 체크리스트</h1>
        <p>랜딩, 진단, 추천, 신청, 이력, 챗봇, 관리자 화면까지 디바이스별 품질 확인 기준을 한 곳에 모았습니다.</p>
        <div className="feature-grid">
          {checkpoints.map((item) => (
            <article key={item.viewport} className="feature-card">
              <h3>{item.viewport}</h3>
              <p>상태: {item.status}</p>
              <p>{item.note}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="panel">
        <p className="eyebrow">Principles</p>
        <h2>검수 원칙</h2>
        <div className="admin-list">
          <p>핵심 CTA는 첫 화면에서 항상 보여야 합니다.</p>
          <p>모바일에서는 카드와 표를 세로 스택 우선으로 전환합니다.</p>
          <p>터치 타겟은 최소 44px 이상을 유지합니다.</p>
        </div>
      </div>
    </section>
  )
}
