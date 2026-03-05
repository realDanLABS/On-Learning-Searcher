# Next Wave Orders (360Learning Benchmark Adaptation)

## foundation
- 운영 환경 토글 정리: debug UI 완전 분리 + 릴리즈 배너/버전 표기
- 공통 Empty/Error/Loading 패턴 컴포넌트화

## diagnosis
- 질문 은행 확장(부문별 15~20문항) 및 문항 랜덤화 옵션
- 진단 중도 이탈 분석 이벤트(문항 인덱스/체류시간) 추가

## recommendation
- 추천 근거 설명 모달(점수/태그/우선순위 산식 요약) 추가
- 즐겨찾기/보류 기능으로 후보 과정 큐 관리

## course-linking
- 이캠퍼스 복귀 콜백 서명 검증(운영 보안 요구사항) 설계
- 신청 실패 재시도 정책(재시도 횟수/지연/감사로그) 명세화

## history
- 부서/직무별 벤치마크 비교 위젯 추가
- 월간 리포트 다운로드(PDF/CSV) 생성 경로 추가

## chatbot
- 컨텍스트 기반 답변 개선(최근 진단/신청 데이터 프롬프트 주입)
- 상담 종료 시 다음 액션 자동 추천(진단 재시작/추천/이력)

## responsive
- 접근성 QA (키보드 포커스, ARIA, 색 대비) 완료
- 모바일 테이블 카드화 및 긴 타임라인 접기 UX 보강
