# 온러닝서처 오케스트레이션 마스터 플랜 (재시작 버전)

## 운영 원칙
- Codex 역할: 오케스트레이터 전용 (직접 기능 구현 금지)
- 개발은 각 워크트리 담당 스레드가 수행
- 통합 기준은 "랜딩 -> 진단 -> 추천 -> 신청 -> 이력" 사용자 흐름 완성

## 최종 사용자 흐름 (E2E)
1. 랜딩 페이지 진입
2. "역량 진단 시작" 클릭
3. 진단 설문 완료 및 결과 확인
4. 개인화 추천 과정 확인
5. 추천 과정에서 신청(이캠퍼스 연동) 진행
6. 학습 이력/성장 경로에서 결과 추적

## 페이지별 역할
- Landing/Dashboard: 진단 시작, 현재 역량 요약, 추천 미리보기
- Diagnosis: 설문, 점수 계산, 스킬 갭 산출
- Recommendation: 추천 목록/필터/추천 이유 제공
- Course Linking: 과정 상세 -> 신청 연동
- History: 진단/수강 이력 및 성장 추세
- Chatbot: 보조 상담, 추천 근거 설명
- Responsive: 전 페이지 디바이스 최적화

## 워크트리-책임 매핑
- `worktrees/foundation` : IA, 레이아웃, 라우팅, 공통 컴포넌트
- `worktrees/diagnosis` : 진단 설문/채점/갭 계산
- `worktrees/recommendation` : 개인화 추천 UI/정렬/필터
- `worktrees/course-linking` : 신청 연동 버튼/파라미터/복귀 플로우
- `worktrees/history` : 이력 대시보드/트렌드
- `worktrees/chatbot` : 챗봇 대화 UX/추천 연계
- `worktrees/responsive` : 반응형 QA 및 보정

## 통합 규칙
1. `foundation`을 기준 브랜치로 유지
2. 모든 기능 브랜치는 `foundation` 최신 반영 후 작업
3. PR 머지 순서:
   - foundation
   - diagnosis
   - recommendation
   - course-linking
   - history
   - chatbot
   - responsive

## 완료 정의(DoD)
- 버튼 클릭 시 다음 단계로 실제 이동
- 진단 결과가 추천에 전달됨(최소 mock contract)
- 추천 과정에서 신청 페이지 이동 가능
- 이력 페이지에서 진단/수강 결과 확인 가능
- 모바일(390)~데스크톱(1440) 주요 화면 깨짐 없음
