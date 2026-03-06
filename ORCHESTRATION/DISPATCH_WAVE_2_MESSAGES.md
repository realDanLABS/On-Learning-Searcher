# Wave 2 복붙용 하달문

## 1) foundation
[오케스트레이터 하달] foundation (Wave2)

대상 경로:
- /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/foundation

목표:
- 운영 모드 기준 공통 상태 패턴 통일 (`Loading`, `Error`, `Empty`)
- 릴리즈 표기(버전/빌드시각) 컴포넌트 추가

완료조건:
- 주요 페이지가 공통 상태 컴포넌트를 재사용
- `npm run lint && npm run test` 통과

회신포맷:
- 요약(3줄) / 파일목록 / 테스트결과 / 리스크

## 2) diagnosis
[오케스트레이터 하달] diagnosis (Wave2)

대상 경로:
- /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/diagnosis

목표:
- 문항 은행 확장(최소 15문항)
- 중도이탈 이벤트(문항 인덱스/체류시간) 계측

완료조건:
- 확장 문항 적용 + 이탈 이벤트 기록
- `npm run test:e2e` 진단 플로우 회귀 통과

회신포맷:
- 요약(3줄) / 파일목록 / 테스트결과 / 리스크

## 3) recommendation
[오케스트레이터 하달] recommendation (Wave2)

대상 경로:
- /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/recommendation

목표:
- 추천 근거 모달(점수/태그/우선순위) 추가
- 후보 과정 즐겨찾기/보류 상태 관리

완료조건:
- 추천카드에서 근거 모달 노출
- 새로고침 후 즐겨찾기/보류 상태 유지

회신포맷:
- 요약(3줄) / 파일목록 / 테스트결과 / 리스크

## 4) course-linking
[오케스트레이터 하달] course-linking (Wave2)

대상 경로:
- /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/course-linking

목표:
- 신청 실패 재시도 UX(횟수/지연/로그) 도입
- 콜백 파라미터 검증 실패 처리 강화

완료조건:
- 실패 시 재시도/이전단계 경로 명확
- 실패/복구 시나리오 테스트 추가

회신포맷:
- 요약(3줄) / 파일목록 / 테스트결과 / 리스크

## 5) history
[오케스트레이터 하달] history (Wave2)

대상 경로:
- /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/history

목표:
- 부서/직무 벤치마크 위젯 추가
- 월간 리포트 다운로드(PDF/CSV) 경로 추가

완료조건:
- 벤치마크 지표 3개 이상 렌더
- 다운로드 버튼 동작 검증

회신포맷:
- 요약(3줄) / 파일목록 / 테스트결과 / 리스크

## 6) chatbot
[오케스트레이터 하달] chatbot (Wave2)

대상 경로:
- /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/chatbot

목표:
- 최근 진단/추천 맥락 기반 답변 강화
- 상담 종료 시 다음 액션 자동 제안

완료조건:
- 유입 경로별 답변 분기 동작
- 종료 패널 CTA 3종 라우트 연결

회신포맷:
- 요약(3줄) / 파일목록 / 테스트결과 / 리스크

## 7) responsive
[오케스트레이터 하달] responsive (Wave2)

대상 경로:
- /Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/worktrees/responsive

목표:
- 접근성 QA(키보드/ARIA/대비) 1차 통과
- 모바일 테이블 카드화 + 긴 타임라인 접기 UX 개선

완료조건:
- 핵심 인터랙션 키보드 접근 가능
- 390px에서 가로 스크롤 최소화

회신포맷:
- 요약(3줄) / 파일목록 / 테스트결과 / 리스크
