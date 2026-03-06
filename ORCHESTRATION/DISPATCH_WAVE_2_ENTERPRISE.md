# Dispatch Wave 2 (Enterprise Commercialization Track)

## 공통 원칙
- 오케스트레이터 하달 전용 문서
- 모든 작업은 각 워크트리에서만 수행
- 완료 시 테스트 증빙을 포함해 회신

## 1) foundation
대상 경로:
- `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/foundation`

목표:
- 운영 모드 기준 공통 상태 패턴 통일 (`Loading`, `Error`, `Empty`)
- 릴리즈 표기(버전/빌드시각) 컴포넌트 추가

산출물:
- 공통 상태 컴포넌트 3종
- AppShell 내 릴리즈 메타 표기 영역
- 관련 단위 테스트

완료 조건:
- 모든 주요 페이지에서 상태 패턴 재사용
- `npm run lint && npm run test` 통과

## 2) diagnosis
대상 경로:
- `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/diagnosis`

목표:
- 문항 은행 확장(최소 15문항)
- 중도이탈 분석 이벤트(문항 번호, 체류시간) 추가

산출물:
- 확장 질문 데이터셋
- 이탈/완주 이벤트 로깅 유틸
- 이벤트 검증 테스트

완료 조건:
- 질문 랜덤 시작 옵션 또는 섹션 분기 동작
- `npm run test:e2e` 내 진단 플로우 회귀 통과

## 3) recommendation
대상 경로:
- `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/recommendation`

목표:
- 추천 근거 모달(점수/태그/우선순위) 추가
- 후보 과정 `즐겨찾기` / `보류` 상태 관리 추가

산출물:
- 추천 근거 UI 모달
- 북마크/보류 상태 저장 로직(local/state)
- 단위 테스트 + e2e 한 케이스

완료 조건:
- 추천 카드에서 근거 보기 클릭 시 상세 근거 노출
- 즐겨찾기/보류 상태가 새로고침 후 유지(로컬 기준)

## 4) course-linking
대상 경로:
- `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/course-linking`

목표:
- 신청 실패 재시도 UX(시도 횟수/대기시간/감사로그) 도입
- 콜백 파라미터 검증 실패 처리 강화

산출물:
- 재시도 정책 UI/로직
- 검증 실패 에러 화면 및 가이드
- 감사로그 이벤트 추가

완료 조건:
- 실패 시 사용자 행동 경로(재시도/이전단계)가 명확
- 실패/복구 시나리오 테스트 추가

## 5) history
대상 경로:
- `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/history`

목표:
- 부서/직무 벤치마크 위젯 추가
- 월간 리포트 다운로드 경로(PDF/CSV) 추가

산출물:
- 벤치마크 비교 카드
- PDF/CSV 다운로드 트리거(목업 가능)
- 데이터 누락시 대체 UI

완료 조건:
- 벤치마크 지표 3개 이상 렌더
- 다운로드 버튼 동작 및 포맷 검증 테스트

## 6) chatbot
대상 경로:
- `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/chatbot`

목표:
- 최근 진단/추천 데이터를 반영한 컨텍스트 답변 강화
- 상담 종료 시 다음 액션 자동 제안

산출물:
- 컨텍스트 프롬프트 주입 함수
- 종료 패널(진단 재시작/추천 보기/이력 보기)
- QA 시나리오 테스트

완료 조건:
- 유입 경로별 답변 톤/제안이 분기됨
- 종료 패널 CTA 3종이 실제 라우트로 연결

## 7) responsive
대상 경로:
- `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/responsive`

목표:
- 접근성(키보드 포커스/ARIA/대비) 1차 통과
- 모바일 테이블 카드 변환 및 타임라인 접기 UX 개선

산출물:
- 접근성 점검 리포트(핵심 위반 목록 포함)
- 모바일 카드형 대체 컴포넌트
- 반응형 e2e 보강

완료 조건:
- 핵심 인터랙션 키보드 접근 가능
- 모바일 뷰포트(390px)에서 가로 스크롤 최소화

## 오케스트레이터 회신 포맷 (모든 워크트리 공통)
- 요약: 변경 내용 3줄
- 파일 목록: 핵심 파일 경로
- 테스트: 실행 명령 + 결과
- 리스크: 미해결 항목 0~N개
