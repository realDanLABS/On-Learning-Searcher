# On Learning Searcher Context Handoff

## 목적
이 문서는 컨텍스트가 초기화되더라도, 다음 대화에서 현재 프로젝트 상태를 빠르게 복구하기 위한 로컬 handoff 메모다.
가능한 한 많은 결정, 사용자 선호, 반복 지시, 실제 구현 상태, 남은 리스크를 보존해서 다음 대화가 끊기지 않게 하는 것이 목적이다.

## 프로젝트 원칙
- 기본 규칙은 `AGENTS.md`를 따른다.
- 원래는 orchestrator-only 프로젝트지만, 사용자 명시 문구 `직접 구현해`가 있었기 때문에 이 세션에서는 직접 구현이 허용되었다.
- 현재 앱은 프론트 중심 구조이며, 데이터 저장은 서버 DB가 아니라 `localStorage` 기반이다.

## 가장 중요한 사용자 선호
- stitch 디자인을 최대한 유지하고, 화면을 다시 그리기보다 데이터와 동작을 자연스럽게 입히는 방식을 선호한다.
- “예쁘게”보다 “죽은 버튼이 없는 것”, “실데이터처럼 보이는 것”, “더미 문구가 없는 것”을 더 중요하게 본다.
- 상단 메뉴/브랜드/프로필/체류시간은 페이지가 달라도 최대한 동일해야 한다.
- 한 페이지에 정보가 너무 많아지는 것을 싫어하며, 핵심 목적이 분명한 구성을 선호한다.
- 회사 시연이 중요하기 때문에, 작은 미완성도나 더미 상태도 민감하게 본다.
- 빠른 구현/빠른 검증을 선호하고, 추상적 설명보다 실제 반영 결과를 원한다.

## 이 프로젝트를 이해할 때 꼭 기억할 핵심 맥락
- 처음에는 여러 worktree와 orchestrator 방식으로 진행했지만, 이후 사용자가 `직접 구현해`를 명시해 실제 코드 수정을 많이 진행했다.
- 디자인은 처음에 여러 차례 자체 리디자인을 했지만, 최종적으로는 사용자가 만든 stitch HTML 디자인을 거의 원본처럼 유지하는 방향으로 전환되었다.
- 따라서 현재 구조는 “React 앱이 stitch HTML을 iframe/runtime bridge로 조작하는 구조”가 핵심이다.
- 사용자는 관리자 페이지도 마찬가지로 stitch 디자인을 유지하되, 실데이터 기반 기능이 붙는 방식을 원한다.

## 현재 제품 구조
실사용 핵심 페이지:
- `/` 홈
- `/platform-intro` 플랫폼 소개
- `/diagnosis` 역량 진단
- `/diagnosis/results` 진단 결과 분석
- `/learning-path` 추천 학습 경로
- `/recommendation` 추천 과정
- `/course-linking` 교육 신청 연동
- `/history` 나의 학습 이력
- `/analytics` 운영 분석
- `/chatbot` 커뮤니티
- `/login` 로그인
- `/signup` 회원가입
- `/admin` 관리자 허브
- `/admin/departments`
- `/admin/questions`
- `/admin/courses`
- `/admin/users`
- `/admin/boards`
- `/admin/settings`

## 실사용 기준 핵심 여정
1. 회원가입
2. 로그인
3. 홈 진입
4. 역량 진단
5. 진단 결과 분석
6. 추천 과정 확인
7. 추천 학습 경로 확인
8. 교육 신청 연동
9. 나의 학습 이력
10. 커뮤니티 상담
11. 필요 시 관리자 화면 진입

## 디자인 구조
- 메인 사용자 화면은 사용자가 제공한 stitch 디자인 HTML을 `public/stitch-runtime/*.html`에서 원본으로 사용한다.
- React는 화면을 다시 그리지 않고, `iframe + runtime bridge` 형태로 stitch 화면에 실데이터를 주입한다.
- 핵심 브리지:
  - `src/shared/components/StitchFrame.tsx`
  - `public/stitch-runtime/runtime.js`
  - `src/shared/stitch/stitchUtils.ts`

## stitch 파일 매핑
- `01-home.html` -> 홈 `/`
- `02-diagnosis.html` -> 역량 진단 `/diagnosis`
- `03-diagnosis-results.html` -> 진단 결과 `/diagnosis/results`
- `04-learning-path.html` -> 추천 학습 경로 `/learning-path`
- `05-recommendation.html` -> 추천 과정 `/recommendation`
- `06-course-linking.html` -> 교육 신청 연동 `/course-linking`
- `07-history.html` -> 나의 학습 이력 `/history`
- `08-analytics.html` -> 운영 분석 `/analytics`
- `09-chatbot.html` -> 커뮤니티 `/chatbot`
- `10-platform-intro.html` -> 플랫폼 소개 `/platform-intro`
- `11-admin-dashboard.html` -> 관리자 대시보드/부서 분석 계열
- `12-admin-departments.html`, `13-admin-questions.html`, `14-admin-courses.html`, `15-admin-users.html`, `16-admin-boards.html` -> 관리자 각 세부 화면

## 주요 저장소 구조
- 실사용 페이지 로직: `src/`
- stitch 원본 디자인: `public/stitch-runtime/`
- 공통 스타일: `src/styles/global.css`
- 상태 저장:
  - 계정: `src/shared/state/accounts.ts`
  - 프로필: `src/shared/state/profile.ts`
  - 질문 뱅크: `src/shared/state/questionBank.ts`
  - 공지/FAQ: `src/shared/state/boards.ts`
  - 러닝 플로우/추천/이력 관련 state/api: `src/shared/state/*`, `src/shared/api/*`

## 인증/프로필
- 회원가입 페이지와 로그인 페이지가 구현되어 있다.
- 회원가입 필드:
  - 소속본부
  - 소속팀
  - 사원번호 (5자리 숫자)
  - 회사 이메일
  - 비밀번호
  - 이름
  - 관심과정
- 회원가입 완료 시 자동 로그인 후 홈으로 이동한다.
- 로그인은 `사원번호 + 비밀번호`로 가능하다.
- 로그인 상태면 `/login` 재진입 시 홈으로 보낸다.
- 우측 상단 공통 헤더에는 실제 로그인 사용자명/조직/체류시간이 유지된다.
- 로그인/회원가입 페이지 상단 헤더도 랜딩과 최대한 동일한 스타일/구조/hover로 맞췄다.
- 로그인/회원가입 헤더의 우측 버튼, 로고 크기, 메뉴 hover, 배경 그라데이션 제거까지 여러 차례 손봤다.

## 인증 관련 세부 규칙
- 사원번호는 `5자리 숫자`만 허용한다.
- 비밀번호는 회원가입 시 필수이며, 입력창은 마스킹된다.
- 회원가입 직후 자동 로그인되며, 별도 로그인 페이지를 다시 보여주지 않는다.
- 관리자 URL에서 회원가입/로그인을 시작하면 가능한 한 `next`를 유지해 관리자 화면으로 복귀하도록 맞췄다.

## 공통 헤더 규칙
- 좌측: 회사 공식 로고 + `On Learning Searcher`
- 중앙 메뉴:
  - 홈
  - 나의 학습
  - 역량 진단
  - 커뮤니티
  - 플랫폼 소개
  - 관리자(권한 있는 경우)
- 우측:
  - 비로그인: 회원가입 / 로그인
  - 로그인: 사용자 정보 / 체류시간 / 로그아웃
- 모든 주요 페이지에서 동일한 메뉴 구조를 쓰도록 맞춰둔 상태다.
- 특히 사용자는 페이지마다 메뉴바 형태가 달라지는 것을 강하게 싫어했다.
- 상단 메뉴 hover도 랜딩과 동일해야 한다는 요구가 있었고, 인증 화면까지 포함해 최대한 맞췄다.
- 좌측 상단에는 회사 공식 로고가 들어가고, 단순 텍스트/아이콘 조합이 아닌 실제 로고 사용이 중요하다.

## 데이터 저장 방식
- 현재는 모두 브라우저 `localStorage` 기반이다.
- 서버 DB는 아직 붙지 않았다.
- 따라서 브라우저가 바뀌면 데이터도 따라가지 않는다.
- 그러나 앱 내부에서는 실제로 생성된:
  - 회원가입 정보
  - 진단 결과
  - 추천 결과
  - 선택 과정
  - 신청 상태
  - 학습 이력
  - 공지/FAQ
를 읽고 쓴다.

## localStorage 주의점
- 이 앱은 정식 서버 DB가 아직 없기 때문에, 같은 브라우저/같은 PC 기준으로만 데이터가 유지된다.
- 회사 시연용으로는 프론트 배포는 가능하지만, 동일 데이터 공유는 DB 전환 없이는 불가능하다.
- 사용자는 나중에 정식 서버 올리기/회사 시연도 고민했지만, 현재 상태는 localStorage 기반 시연/프로토타입 수준이다.

## 홈 페이지 핵심 상태
- 히어로 카피는 최근 수정됨:
  - 칩: `ON LEARNING SEARCHER`
  - 메인: `AI 역량진단 기반의<br/>맞춤형 학습설계 플랫폼`
  - 서브: `회사의 개인화된 학습 경로 설계를 통해...`
- 홈 하단에는 `공지사항`과 `FAQ` 섹션이 추가되어 있으며, 관리자 보드 데이터와 연결된다.
- 추천 과정 수와 역량 지수 변화값은 더미가 아니라 실제 진단/추천 상태 기반으로 계산되도록 수정되었다.
- 홈 하단에는 `공지사항`, `FAQ` 섹션이 들어가 있으며 관리자 보드 데이터와 연결된다.
- 추천 과정 수는 실제 화면 기준 상위 추천 3개로 보이도록 바뀌었다.
- 역량 지수의 증감값도 고정 `+5.2%`가 아니라 이전/현재 진단 비교 기반으로 바뀌었다.

## 홈 최근 카피 상태
- 칩 문구: `ON LEARNING SEARCHER`
- 메인 카피: `AI 역량진단 기반의<br/>맞춤형 학습설계 플랫폼`
- 서브 카피:
  - `회사의 개인화된 학습 경로 설계를 통해`
  - `당신의 잠재력을 깨우고 커리어 패스를 스마트하게 설계하세요.`
- 이 카피는 사용자가 여러 차례 수정 요청한 결과물이므로 함부로 바꾸지 않는 것이 좋다.

## 진단/추천/신청/이력 상태
- 진단 질문은 제조업 맥락의 20문항 객관식이다.
- 진단 페이지 선택지는 1x4 세로 배치로 변경됨.
- 진단 결과 페이지는 실제 이전/현재 점수 비교로 상승률을 표시한다.
- 학습 경로 페이지 하단 고정 바는 제거되었다.
- 교육 신청 연동 페이지의 버튼 문구:
  - `추천 과정 수강 완료`
- 이 버튼은 `나의 학습 이력`의 `학습 추천 과정` 상태와 연동되어 `수강 완료`로 반영되게 맞춰졌다.
- `나의 학습 이력`은 더미 완료 과정이 아니라 실제 추천 상위 3개 기준으로:
  - 추천 과정 수
  - 추천 학습 시간
  - 현재 이어갈 학습
  - 학습 추천 과정
을 보여준다.

## 진단 페이지 세부 상태
- 선택지는 2x2에서 1x4 세로 배치로 변경되었다.
- 선택 박스 기본 색상은 모두 동일하게 맞췄고, 선택 시에만 하이라이트된다.
- `응답 현황` 카드의 `우선 순위 1` 문구는 `진단 영역`으로 바꿨다.
- 상단 진단 헤더 메뉴 정렬 문제를 여러 번 수정했고, 현재는 랜딩과 동일한 공통 헤더를 쓰는 방향이다.

## 진단 결과 페이지 세부 상태
- `추천 과정 보러가기` 버튼은 실제 `/recommendation`으로 이동한다.
- 점수 상승률은 이전 진단과의 실제 차이로 계산한다.
- 버튼 그림자는 버튼색과 맞는 블루 계열로 맞췄다.
- `추천 미리보기`는 보조 영역으로 접거나 약하게 처리하는 방향을 선호했다.

## 추천 페이지 세부 상태
- 추천 과정은 실추천 데이터 기반이다.
- 보조 섹션(`나중에 볼 과정`, `대체 추천`)은 progressive disclosure로 접는 방향을 썼다.
- 추천 카드/학습이력/현재 이어갈 학습은 가능한 한 실제 진단 기반 상위 추천 3개와 일관되게 맞추는 것이 중요하다.

## 학습 경로 페이지 세부 상태
- 하단 고정 바/저장/수강신청 관련 기능은 여러 번 변경되다가 최종적으로 제거되었다.
- 현재는 하단 추천 저장 바가 없는 상태가 맞다.
- 경로 카드 클릭은 교육 신청 연동 또는 추천 저장 흐름과 연결된 적이 있으나, 마지막 상태를 다시 확인할 필요가 있다.

## 교육 신청 연동 페이지 세부 상태
- 버튼 문구는 `데스크톱 신청 완료 처리`에서 `추천 과정 수강 완료`로 변경됐다.
- 이 버튼은 나의 학습 이력의 `학습 추천 과정`과 연동되어 상태를 `수강 완료`로 반영해야 한다.
- 신청/예외 대응 영역은 여러 차례 간소화되었다.

## 나의 학습 이력 그래프 상태
- `역량 성장 변화`는 현재 월별 더미가 아니라 영역별 점수 기반 그래프로 바뀌었다.
- 영역 막대는 연한 회색.
- `점수 종합` 막대는 블루 톤 유지.
- 각 영역 점수는 박스 없는 진한 회색 텍스트.
- `점수 종합` 점수만 짙은 블루의 둥근 직사각형 배지 + 흰색 글자로 유지.
- 영역별 점수는 실제 진단 영역 점수를 100점 환산해서 보여준다.
- 사용자는 그래프 색상이 알록달록한 것을 싫어해서, 영역별 막대는 옅은 회색으로 통일했다.
- `점수 종합`만 블루 톤 강조를 유지하는 것이 중요한 시각 규칙이다.
- `학습 추천 과정`은 더미가 아니어야 하며, 실제 진단을 통해 나온 추천 과정으로 주입되어야 한다.
- `현재 이어갈 학습`의 사용자명은 반드시 로그인 사용자명으로 나와야 한다.
- 버튼 문구는 `다음 학습 과정 추천 받기`로 바뀌었다.

## 커뮤니티(챗봇) 상태
- 빠른 질문 버튼:
  - 내 부족 역량 알려줘
  - 최근 신청 상태 알려줘
  - 추천 이유
  - 선택 과정 코칭
- 이 버튼들은 이제 `준비중` 알림 없이 바로 채팅 답변을 생성한다.
- 채팅 입력창도 동작하고, 현재 사용자 진단/추천/신청 상태 기반 응답이 생성된다.
- 챗봇 오른쪽 패널은 실제 진단/추천 상태를 반영하도록 바뀌었다.
- 챗봇 안내 문구/아이콘/입력 영역 스타일이 여러 차례 수정되었고, 현재는 비교적 안정 상태다.

## 커뮤니티(챗봇) 세부 상태
- 빠른 질문 버튼 클릭 시 `준비중` alert 없이 바로 대화로 이어져야 한다.
- 실제 AI 연동까지는 완전한 외부 모델 연결이 아니라, 현재 사용자 상태를 바탕으로 컨텍스트 기반 응답을 생성하는 구조가 붙어 있다.
- 호칭은 `책임님`, `매니저님` 같은 직함 대신 그냥 `님`으로 통일했다.
- 왼쪽 메뉴는 `AI 챗봇 상담`, `내 학습 현황`, `추천 로드맵` 정도로 정리되어 있고 중복 메뉴는 제거했다.
- 채팅 영역 높이/하단 여백/그라데이션/그림자/아이콘 색은 여러 번 사용자가 미세조정 요청을 했다.
- `smart_toy`, `send` 계열 아이콘은 시그니처 짙은 청색으로 바꿨다.
- 채팅 입력창 아래 안내 문구는 삭제했다가 복구하는 요청이 있었으므로, 현재 실제 상태는 다시 확인 필요.
- 오른쪽 패널의 `현재 학습 상태 요약`, `추천 학습 로드맵`도 더미가 아니라 실제 진단/추천 상태 기반이어야 한다.

## 플랫폼 소개 페이지
- 새 페이지 `/platform-intro` 추가됨.
- 상단 메뉴의 `플랫폼 소개`에서 연결된다.
- 히어로 블록은 제거했고, 바로 본문으로 시작한다.
- 최근 문구 수정:
  - `AI 기반의 퍼스널 러닝 파트너`
  - `On Learning Searcher는 모든 회사 구성원이 ...`

## 플랫폼 소개 페이지 세부 상태
- 상단 다크 히어로 영역은 사용자가 삭제 요청해서 제거되었다.
- 이제 바로 `성장의 여정을 정의합니다`부터 시작한다.
- 비전 문구:
  - `AI 기반의 퍼스널 러닝 파트너`
- 본문 문구:
  - `On Learning Searcher는 모든 회사 구성원이`
  - `자신만의 속도와 방향으로 성장할 수 있도록 곁에서 돕는 가장 똑똑한 '러닝 파트너'가 되겠습니다.`
- 이 페이지는 소개형 정보 페이지이므로 과한 CTA보다 설명 중심 구조를 선호했다.

## 관리자 페이지 상태
- 관리자 페이지는 stitch 6~7개 화면 기반으로 구현되어 있다.
- 현재 경로:
  - `/admin`
  - `/admin/departments`
  - `/admin/questions`
  - `/admin/courses`
  - `/admin/users`
  - `/admin/boards`
  - `/admin/settings`
- 관리자 페이지는 한국어화되어 있으며, `On Learning Searcher`만 영어 유지.
- 현재 실기능:
  - 문항 CRUD + 검색 + CSV
  - 과정 CRUD + 검색 + CSV
  - 회원 수정/권한 변경/삭제 + 검색/필터 + CSV
  - 공지/FAQ CRUD + 검색 + CSV
  - 시스템 설정 페이지
  - 토스트 피드백
  - 필드 단위 유효성 검사
  - 검색 empty state
- 관리자도 localStorage 실데이터를 사용한다.

## 관리자 페이지 세부 요구
- 관리자 페이지는 전부 한국어여야 한다. `On Learning Searcher`만 영어 유지.
- stitch 관리자 화면 기준으로 가능한 한 디자인을 유지하면서 기능을 입혀야 한다.
- 현재 구현된 관리자 기능은 “실데이터 형태(localStorage 기반)”로 동작하지만, 공용 서버 DB 운영 단계는 아니다.
- 관리자 페이지는 다음 요구를 이미 어느 정도 만족해야 한다:
  - 문항 관리
  - 과정 관리
  - 회원 관리
  - 공지 관리
  - FAQ 관리
  - 운영 분석
  - 시스템 설정
- 관리자 검색/필터/CSV/토스트/모달/유효성 검사까지 상당 부분 구현된 상태다.
- 사용자는 관리자 페이지도 “디자인만 있는 목업”이 아니라 실제 동작하는 운영 도구를 원했다.

## 하단/스크롤 관련 이슈
- 전 페이지에서 무한 하단 확장 문제가 반복적으로 발생했었다.
- 현재는 `StitchFrame`과 `runtime.js`에서 푸터 하단 기준으로 높이를 맞추는 로직이 들어가 있다.
- 하지만 사용자가 마지막으로도 일부 페이지에서 하단 확장이 남아 있다고 느꼈을 가능성이 있다.
- 다음 세션에서 가장 먼저 다시 검증할 가치가 큰 부분이다.

## 하단/스크롤 이슈 히스토리
- 거의 모든 페이지에서 “콘텐츠가 끝났는데도 아래로 계속 스크롤되는 문제”가 반복적으로 보고되었다.
- 한때 `추천 학습 경로`는 반대로 하단이 잘려서 마지막 콘텐츠가 안 보이는 문제도 있었다.
- 지금은 푸터 하단을 페이지 끝으로 강제 잡는 아이디어가 반영되어 있지만, 사용자가 다시 문제를 느끼면 `runtime.js`와 `StitchFrame.tsx`를 먼저 확인해야 한다.
- 푸터 문구는 공통으로:
  - `© 2026 Company Corp. All rights reserved. On Learning Searcher는 회사 구성원의 맞춤화된 학습과 성장을 위해 제작되었습니다.`
  로 통일한 상태다.

## 최근 중요 사용자 요구
- 모든 버튼은 죽은 버튼 없이 실제 동작 또는 명시적 안내가 있어야 함
- 상단 메뉴는 전 페이지 동일해야 함
- 관리자 페이지는 한국어로
- 더미 텍스트는 최대한 제거하고 실제 로그인 사용자/실제 추천 데이터 기반으로 보여야 함
- 회사 시연을 염두에 둔 안정성/완성도 중요

## 반복적으로 나온 중요 지시
- “죽은 버튼이 하나라도 있으면 안 된다”
- “같은 페이지로 튕기거나 랜딩으로 의미 없이 돌아가면 안 된다”
- “프로필은 우측 상단에만, 모든 페이지에서 유지”
- “더미 이름(김현대, 홍길동, 직원)이 고정으로 보이면 안 된다”
- “stitch 디자인을 흐트러뜨리지 말고 내용만 바꿔라”
- “관리자 페이지도 실제 기능이 있어야 한다”
- “모든 페이지는 한국어 중심, 단 브랜드명 On Learning Searcher는 유지”

## 검증 상태
최근 반복적으로 `npm run lint`, `npm run build`는 통과했다.
다만 다음 세션에서 큰 수정 전에 다시 한 번 둘 다 돌리는 것이 안전하다.

## 최근 자주 쓴 검증 방식
- `npm run lint`
- `npm run build`
- 필요 시 local preview 서버 구동
- Playwright로 실제 클릭/캡처 확인
- 사용자는 실제 화면 캡처를 자주 요청했기 때문에, 시각 검증이 중요하다.

## 자주 참조할 출력/산출물
- 최신 페이지 캡처 폴더:
  - `output/playwright/current-pages-20260307/`
- 실행용 압축본:
  - `output/runtime-only-package/on-learning-searcher-runtime-only.zip`
- 회사 시연용 handoff/설명은 있었지만, 현재 사용자는 다시 개발 모드에 집중하고 있다.

## 다음 세션 시작 추천 순서
1. 이 문서와 `AGENTS.md` 읽기
2. `npm run lint`
3. `npm run build`
4. 사용자가 마지막으로 지적한 화면/동작 재현
5. 필요하면 Playwright로 최신 상태 재캡처

## 다음 세션에서 특히 먼저 볼 만한 파일
- `public/stitch-runtime/runtime.js`
- `src/shared/components/StitchFrame.tsx`
- `src/shared/layouts/AppShell.tsx`
- `src/router/AppRouter.tsx`
- `src/features/history/pages/HistoryPage.tsx`
- `src/features/chatbot/pages/ChatbotPage.tsx`
- `src/features/admin/*`
- `public/stitch-runtime/01-home.html`
- `public/stitch-runtime/07-history.html`
- `public/stitch-runtime/09-chatbot.html`
- `public/stitch-runtime/10-platform-intro.html`

## 메모
- 사용자는 빠른 실행을 선호하지만, “안 되는 버튼”이나 “더미 데이터”를 매우 민감하게 본다.
- 사용자는 stitch 디자인을 그대로 유지하면서 데이터/동작만 자연스럽게 입히는 방향을 선호한다.
- 불필요한 재설명보다 실제 수정과 검증을 바로 하는 쪽이 만족도가 높다.
- handoff를 더 자세하게 써달라는 요청이 있었으므로, 다음에 또 누적 메모를 남길 때는 이 문서에 계속 append/update하는 방식이 좋다.
- “지시한 내용 하나라도 잊지 않기”를 매우 중요하게 본다.

## 페이지별 변경 이력 로그

### 1. 홈 `/`
- 여러 번의 리디자인 끝에 stitch 홈 디자인을 원본으로 채택했다.
- 히어로 카피를 사용자가 여러 차례 수정했다.
  - 최종 칩: `ON LEARNING SEARCHER`
  - 최종 메인: `AI 역량진단 기반의<br/>맞춤형 학습설계 플랫폼`
  - 최종 서브:
    - `회사의 개인화된 학습 경로 설계를 통해`
    - `당신의 잠재력을 깨우고 커리어 패스를 스마트하게 설계하세요.`
- 히어로 폰트 크기를 줄여 2줄에 맞추는 미세조정 요청이 있었다.
- CTA 버튼/추천 카드/추천 수/역량 지수 상승률은 더미가 아니라 실데이터 기준으로 바뀌었다.
- `최근 진단일 / 역량 지수 / 추천 과정 / 학습 중`이 실제 데이터 기반이 되도록 수정했다.
- 홈 하단에 `공지사항`, `FAQ` 섹션을 추가했고 관리자 보드 데이터와 연결했다.
- 추천 과정 카드 클릭 시 무반응이면 안 되고, 진단 전이면 진단으로 유도되도록 바뀌었다.
- `이전 진단 결과 보기`는 결과가 없으면 안내 후 진단으로 유도되도록 수정되었다.

### 2. 플랫폼 소개 `/platform-intro`
- 새로 추가된 페이지다.
- 사용자가 제공한 stitch 디자인 기반으로 제작했다.
- 처음에는 상단 다크 히어로 섹션이 있었지만 사용자가 삭제 요청했다.
- 현재는 바로 `성장의 여정을 정의합니다` 섹션부터 시작한다.
- 비전 문구는 여러 번 수정 끝에:
  - `AI 기반의 퍼스널 러닝 파트너`
로 정리되었다.
- 본문도:
  - `On Learning Searcher는 모든 회사 구성원이`
  - `자신만의 속도와 방향으로 성장할 수 있도록 곁에서 돕는 가장 똑똑한 '러닝 파트너'가 되겠습니다.`
로 변경되었다.

### 3. 역량 진단 `/diagnosis`
- 질문 페이지는 stitch 디자인을 유지하면서 상단 헤더/프로필/시간을 공통 셸로 맞추는 작업이 반복되었다.
- 객관식 선택지는 2x2 -> 1x4 세로 구조로 변경되었다.
- 기본 선택색이 하나만 다르게 보이던 문제를 해결했고, 이제 선택 시에만 하이라이트된다.
- 진단 상단 오른쪽 진행시간은 고정 `12:45`가 아니라 실시간 카운팅으로 바뀌었다.
- 우측 `응답 현황` 카드의 `우선 순위 1` 문구는 `진단 영역`으로 변경되었다.
- 선택지를 눌러도 하이라이트/다음 문항 이동이 안 되던 큰 버그가 있었고, runtime/action 연결로 해결했다.

### 4. 진단 결과 분석 `/diagnosis/results`
- 이 페이지의 핵심은 “점수”보다 “무엇을 먼저 해야 하는가”였다.
- `추천 과정 보러가기` 버튼은 실제 `/recommendation` 이동으로 연결됐다.
- 버튼 그림자색이 주황이라 이질감이 있었고, 버튼색에 맞는 블루 그림자로 바꿨다.
- 점수 상승률은 고정값이 아니라 이전/현재 진단 결과 비교로 계산되게 수정했다.
- 추천 미리보기는 메인 행동을 방해하지 않도록 보조 영역으로 약화/접기 처리되었다.

### 5. 추천 학습 경로 `/learning-path`
- 원래는 하단 고정 바가 있었고, `선택한 경로 수강신청`, `임시 저장`, `추천 과정으로 저장하기` 등 여러 안을 거쳤다.
- 현재 최종 상태는 하단 바를 아예 제거한 버전이다.
- 한때 `추천 과정으로 저장하기` 버튼 하나만 남기는 안도 구현되었으나, 사용자가 최종적으로 하단 바 전체 삭제를 원했다.
- `수료증 포함` 문구도 삭제되었다.
- 경로 카드 클릭 동작은 교육 신청 연동으로 보내는 흐름과 저장 흐름이 오갔으므로, 다음 세션에서 실제 현재 동작을 꼭 재확인하는 것이 좋다.
- 하단 막힘/스크롤 문제의 중심 페이지 중 하나였다.

### 6. 추천 과정 `/recommendation`
- 추천 화면은 교육 쇼핑몰처럼 보이지 않게, AI 추천 화면처럼 보이게 정리되었다.
- 추천 상위 4개가 메인이고, `나중에 볼 과정`, `대체 추천`은 접힘형으로 보조 처리됐다.
- 중앙 더미 프로필(`김현대 님`)은 제거되었다.
- 추천 카드는 더미가 아니라 실제 진단 기반 추천 결과를 반영해야 한다.
- 추천 카드 클릭/수강신청/상세보기가 죽은 버튼이면 안 된다는 요구가 강했다.

### 7. 교육 신청 연동 `/course-linking`
- 이 페이지는 전환 페이지 역할로 정리되었다.
- 버튼 문구는 `데스크톱 신청 완료 처리`에서 `추천 과정 수강 완료`로 변경되었다.
- 이 버튼은 `나의 학습 이력`의 `학습 추천 과정`과 연동되어 상태를 `수강 완료`로 바꾸도록 수정되었다.
- `신청 전 체크`, `예외 대응` 영역은 progressively disclosure 또는 보조 영역으로 약화되었다.
- 오른쪽 sticky 신청 패널은 유지하는 방향이었다.

### 8. 나의 학습 이력 `/history`
- 가장 많은 더미 데이터 정리 요청이 들어왔던 페이지 중 하나다.
- `완료 과정 수`, `누적 학습 시간`은 우리 시스템이 실제 completion/time을 아는 구조가 아니므로:
  - `추천 과정 수`
  - `추천 학습 시간`
으로 변경되었다.
- 값도 실제 추천 상위 3개 기준으로 계산하도록 수정되었다.
- `학습 추천 과정`은 더미 과정명이 아니라 실제 진단을 통해 도출된 추천 상위 3개가 들어가야 한다.
- `현재 이어갈 학습`도 로그인 사용자 기준이어야 하며, 더미 `홍길동 책임님` 같은 문구는 제거했다.
- 그래프는 처음엔 더미 월별 막대였다가, 현재는 영역별 점수 기반 그래프로 바뀌었다.
- 그래프 스타일 최종 요구:
  - 영역 막대: 아주 옅은 회색
  - 영역 점수: 막대 위 진한 회색 텍스트, 박스 없음
  - `점수 종합` 막대: 블루 톤 유지
  - `점수 종합` 점수: 짙은 블루의 둥근 직사각형 배지 + 흰색 글자
- `6월` 라벨은 `점수 종합`으로 바뀌었다.

### 9. 운영 분석 `/analytics`
- 개인 화면과 완전히 다른 관리자/운영 해석 화면처럼 보여야 했다.
- 관리자 페이지와 별도로 사용자 측 운영 분석 화면도 존재한다.
- KPI/퍼널/부서 비교/실패 사유 등 구조가 반복적으로 정리되었다.
- 더미 관리자 이름은 제거되거나 실제 로그인 사용자 기준으로 덮어써야 한다.

### 10. 커뮤니티 `/chatbot`
- 빠른 질문 버튼은 `준비중` alert 없이 바로 실제 대화로 이어져야 한다는 요구가 강했다.
- 실제 컨텍스트(진단/추천/신청 상태) 기반 답변 생성 구조가 붙어 있다.
- 호칭은 직함 없이 `님`으로 통일되었다.
- 왼쪽 메뉴는 중복 항목을 줄여:
  - `AI 챗봇 상담`
  - `내 학습 현황`
  - `추천 로드맵`
정도로 정리했다.
- 채팅 영역 높이는 사용자가 여러 번 조정 요청했다.
  - 너무 길게 -> 1/3 줄이기 -> 1/4 더 줄이기 과정을 거쳤다.
- 하단 입력창 주변 주황 그라데이션, 그림자, 여백 등을 반복적으로 제거/조정했다.
- `AI 챗봇 상담사` 옆 빈 박스에는 회사 로고를 넣었다.
- `smart_toy`, `send` 아이콘은 시그니처 짙은 청색으로 바꿨다.
- 오른쪽 패널의 `현재 학습 상태 요약`, `추천 학습 로드맵`은 더미가 아니라 실제 진단/추천/신청 상태 기반이어야 한다.

### 11. 로그인 `/login`
- 상단 메뉴바는 랜딩페이지와 동일한 톤/구조/hover로 맞추는 요구가 강했다.
- 타원형 프레임/둥근 배경/그라데이션은 제거되었다.
- 로그인은 최종적으로 `사원번호(5자리 숫자) + 비밀번호`만으로 가능하게 바뀌었다.
- `회사 이메일` 입력은 제거되었다.
- 문구도 `가입한 사원정보로 로그인`이 아니라 단순 `로그인`으로 정리되었다.
- `Company IDENTITY` 같은 문구는 `On Learning Searcher`로 바뀌었다.

### 12. 회원가입 `/signup`
- 상단 메뉴바는 로그인과 마찬가지로 랜딩과 동일하게 맞췄다.
- `소속실` 항목은 제거되었다.
- 현재 필드는:
  - 소속본부
  - 소속팀
  - 사원번호(5자리 숫자)
  - 회사 이메일
  - 비밀번호
  - 이름
  - 관심과정
- 가입 완료 후 자동 로그인 및 홈 이동이 핵심이다.
- 관리자 URL로 가입하면 `next`를 가능한 한 유지하도록 했다.

### 13. 관리자 허브 `/admin`
- 관리자 허브는 관리 기능의 진입점 역할이다.
- first-paint 영어가 보이던 부분을 stitch 원본 HTML에서 한국어로 많이 치환했다.
- `manager`/`admin` 권한 사용자만 들어갈 수 있어야 한다.
- direct URL 접근 시 로그인/회원가입 후 관리자 페이지로 복귀하도록 `next` 흐름을 다듬었다.

### 14. 관리자 부서 분석 `/admin/departments`
- 검색/CSV 내보내기와 함께 한국어 first-paint 반영이 중요했다.
- 부서 분석/참여율/완료율/역량 격차 등의 표현을 한국어 운영 문맥으로 정리했다.

### 15. 관리자 문항 관리 `/admin/questions`
- 실제 질문 bank를 읽고 수정하는 CRUD 기능이 연결되어 있다.
- 같은 영역에 동일 문항 중복 등록 방지 로직이 들어갔다.
- 검색/CSV/모달 폼/유효성 검사/토스트가 붙어 있다.

### 16. 관리자 과정 관리 `/admin/courses`
- 실제 추천 엔진에 쓰이는 과정 데이터를 관리한다.
- 중복 과정명 방지, 검색, CSV, 모달 폼, 유효성 검사, 토스트가 붙어 있다.
- first-paint 영어를 한국어화하는 수정도 들어갔다.

### 17. 관리자 회원 관리 `/admin/users`
- 실제 localStorage 계정 정보를 읽는다.
- 회원 수정, 권한 변경, 삭제, 검색, 필터, CSV가 붙어 있다.
- 현재 로그인 사용자 수정 시 우측 상단 프로필에도 반영되도록 했다.
- first-paint 영어를 한국어화했다.

### 18. 관리자 공지/FAQ 관리 `/admin/boards`
- 홈의 `공지사항`, `FAQ`와 연결된 실제 보드 관리 화면이다.
- 공지/FAQ 추가/수정/삭제/검색/CSV가 구현되어 있다.
- 동일 제목/질문 중복 방지 로직이 들어갔다.
- first-paint 영어를 한국어화했다.

### 19. 관리자 시스템 설정 `/admin/settings`
- 관리자 메타/운영 스냅샷/JSON 내보내기/관리 화면 바로가기 등을 보여주는 설정형 페이지다.
- 관리자 페이지 구현이 진행되면서 추가된 페이지다.

## 파일 단위 주의 포인트
- `public/stitch-runtime/runtime.js`
  - 대부분의 실동작, 라우팅, 데이터 주입, 버튼 바인딩, 더미 제거, footer 주입, height 계산 이곳에 모인다.
  - 문제가 생기면 가장 먼저 볼 파일이다.
- `src/shared/components/StitchFrame.tsx`
  - 하단 무한 확장, iframe 높이, 페이지 잘림 문제의 핵심 포인트다.
- `src/features/history/pages/HistoryPage.tsx`
  - 나의 학습 이력의 실데이터 구성, 추천 상위 3개 사용, 그래프 데이터 계산의 핵심이다.
- `src/features/chatbot/pages/ChatbotPage.tsx`
  - 빠른 질문/실응답/우측 패널 데이터 구성의 핵심이다.
- `src/features/admin/*`
  - 관리자 실데이터 기능과 폼/검증/토스트 중심 영역이다.

## 마지막 강한 권장
- 다음 세션에서 작업 시작 전:
  1. 이 문서 읽기
  2. `npm run lint`
  3. `npm run build`
  4. 사용자 마지막 지적 화면 먼저 재현
순서를 지키면 가장 안전하다.

## 파일별 변경 로그

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/public/stitch-runtime/runtime.js`
- 이 프로젝트에서 가장 중요한 파일이다.
- stitch HTML에 실데이터를 주입하는 대부분의 로직이 여기 있다.
- 주요 역할:
  - 상단 공통 헤더/브랜드/프로필/체류시간 구성
  - 버튼/링크 라우팅
  - 죽은 버튼 방지용 fallback
  - 각 페이지별 더미 텍스트 제거
  - 홈/이력/챗봇/관리자 데이터 주입
  - 공통 푸터 주입
  - iframe 높이 계산 postMessage
- 과거에 이 파일에서 많이 해결한 문제:
  - 홈 CTA 무반응
  - 진단 페이지 선택 하이라이트 안 됨
  - 챗봇 빠른 질문에서 `준비중` alert 뜨던 문제
  - 상단 메뉴바 페이지별 불일치
  - 로그인 전/후 프로필 표시 꼬임
  - 관리자 first-paint 영어 노출
  - 하단 무한 확장
- 다음 세션에서 버튼/더미/헤더/스크롤 문제가 보이면 가장 먼저 이 파일을 본다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/src/shared/components/StitchFrame.tsx`
- stitch iframe 높이를 맞추는 핵심 컴포넌트다.
- 하단이 계속 늘어나거나, 반대로 콘텐츠가 잘리는 문제는 이 파일과 runtime height postMessage를 같이 봐야 한다.
- 기존에는 최소 높이가 너무 커서 빈 스크롤이 생겼고, 이후 실제 콘텐츠 높이 기준으로 조정했다.
- 여전히 사용자가 하단 확장을 느끼면 이 파일 재검토가 필요하다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/src/shared/stitch/stitchUtils.ts`
- stitch 페이지 공통 payload 생성 유틸이다.
- 기본 사용자명, 세션 시작 시각, 프로필 기본값 등을 조절한다.
- 로그인 전 가짜 이름이 보이는 문제를 줄이는 데 사용했다.
- 페이지 전환 후 프로필/체류시간 일관성 문제를 볼 때 같이 확인한다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/src/shared/layouts/AppShell.tsx`
- React 기반 인증 페이지와 일부 공통 셸의 헤더를 담당한다.
- 로그인/회원가입 페이지 상단 메뉴바를 랜딩과 최대한 동일하게 맞추는 작업을 이 파일에서 많이 했다.
- 로고 크기, 제품명 색/크기, 메뉴 hover, 우측 버튼 스타일이 여기와 `global.css`에서 같이 결정된다.
- 인증 화면 헤더가 랜딩과 다르면 이 파일부터 본다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/src/styles/global.css`
- 공통 스타일 전체를 담당한다.
- 사용자 요구에 따라 매우 많은 미세조정이 이 파일에서 발생했다.
- 특히 다음 이슈가 생기면 여기 확인:
  - 인증 헤더 hover가 랜딩과 다름
  - 버튼 크기/모양 불일치
  - 관리자 모달/토스트 스타일
  - 유틸리티 카드/보조 카드 위계
  - footer/spacing/compact row 정렬
- “디자인은 stitch 유지, 나머지 미세 스타일 보정”은 대체로 이 파일이 담당한다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/src/router/AppRouter.tsx`
- 전체 페이지 라우트 정의 파일.
- `/platform-intro`, `/admin/*`, `/login`, `/signup` 등 새 페이지 추가가 여러 번 들어갔다.
- 가드 정책과 새 관리자/소개 페이지 연결을 볼 때 중요하다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/src/router/StageGuard.tsx`
- 보호 페이지 접근 제어를 담당한다.
- `/admin` 직접 접근 시 로그인/회원가입 후 다시 관리자 페이지로 보내는 흐름 정리 시 이 파일을 만졌다.
- 특정 메뉴가 클릭은 되는데 홈으로 튕기면 이 파일과 라우트 가드를 함께 확인한다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/src/router/HomePage.tsx`
- 홈 payload를 만드는 핵심 파일.
- 홈의:
  - 최근 진단일
  - 역량 지수
  - 추천 과정 수
  - 학습 중
  - 공지사항
  - FAQ
  - 추천 Top3
데이터를 stitch 홈에 맞게 넣는다.
- 더미 `10개 과정`, `+5.2%` 같은 값들을 실데이터로 바꾸는 작업이 들어갔다.
- 홈 숫자가 다시 이상하면 이 파일과 runtime 홈 주입 로직을 같이 봐야 한다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/src/features/diagnosis/pages/DiagnosisPage.tsx`
- 진단 질문 데이터와 runtime 상호작용을 연결한다.
- 객관식 선택지 클릭 후 다음 문항 이동, 하이라이트 유지 등과 관련된 핵심 React 쪽 파일이다.
- 질문 수, 진단 카테고리, 진단 완료 흐름을 볼 때 중요하다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/src/features/diagnosis/pages/DiagnosisResultsPage.tsx`
- 결과 화면 payload와 점수 상승률 계산에 중요하다.
- 이전 진단 결과와 현재 결과를 비교해 퍼센트를 계산하는 로직이 있다.
- `추천 과정 보러가기` CTA가 실제 이동하는지도 이 파일이 관련된다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/src/features/recommendation/pages/LearningPathPage.tsx`
- 학습 경로 페이지 React 쪽 파일.
- 과거에 하단 바/저장/수강신청 흐름이 여러 번 바뀌어서 문맥이 가장 복잡한 파일 중 하나다.
- 현재 stitch HTML 하단 바는 제거된 상태가 맞는지, 클릭 액션이 무엇인지 다시 볼 때 중요하다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/src/features/recommendation/pages/RecommendationPage.tsx`
- 추천 결과 payload, 상위 추천 과정 주입, 추천 이유 문구, 추천 수 계산과 관련된다.
- 추천 화면 자체는 stitch HTML이 주도하지만, 어떤 과정을 얼마만큼 보여줄지의 데이터 쪽은 이 파일이 중요하다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/src/features/course-linking/pages/CourseLinkingPage.tsx`
- 선택한 과정의 상세/신청 상태/수강 완료 처리를 연결한다.
- `추천 과정 수강 완료`를 눌렀을 때 이력과 연결되는 흐름을 볼 때 중요하다.
- 신청 상태, 선택 과정, 다음 단계 연결이 어긋나면 이 파일을 먼저 본다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/src/features/history/pages/HistoryPage.tsx`
- 현재 사용자 요청이 가장 많이 반영된 파일 중 하나다.
- 핵심 역할:
  - 추천 과정 수
  - 추천 학습 시간
  - 현재 이어갈 학습
  - 학습 추천 과정
  - 역량 성장 변화 그래프
- 특히 그래프는:
  - 영역별 점수 100점 환산
  - 영역 막대 옅은 회색
  - 점수 종합은 블루 강조
를 맞추는 로직이 들어간다.
- 추천 상위 3개 기준으로 보이게 맞추는 작업도 여기서 했다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/src/features/history/pages/AnalyticsPage.tsx`
- 사용자 측 운영 분석 페이지.
- 관리자 페이지와는 별개로, 사용자 앱 쪽 운영 분석 정보를 구성하는 파일이다.
- 더미 관리자 이름/운영 해석 문구 제거, 운영 요약 카드, 액션 제안 정리 등이 들어갔다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/src/features/chatbot/pages/ChatbotPage.tsx`
- 커뮤니티 React 로직 핵심 파일.
- 빠른 질문 클릭 시 어떤 질문을 보내는지, 어떤 컨텍스트를 넣는지, 초기 메시지/우측 패널 데이터를 어떻게 만드는지 담당한다.
- “준비중 없이 바로 답변” 요구는 runtime와 이 파일이 함께 맞춰져야 했다.
- 호칭 `님` 통일도 이 파일에 반영됐다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/src/features/platform/pages/PlatformIntroPage.tsx`
- 플랫폼 소개 페이지 payload 생성 파일.
- 소개 페이지 자체는 mostly static 성격이 강하지만, 라우트/헤더/브랜드 일관성 측면에서 중요하다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/src/features/auth/pages/LoginPage.tsx`
- 로그인 폼 로직 핵심 파일.
- `회사 이메일 제거 -> 사원번호 + 비밀번호 로그인`으로 바뀐 기록이 중요하다.
- 사원번호 5자리 숫자 검증, 로그인 후 리디렉션, 이미 로그인 상태면 홈으로 보내는 로직이 있다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/src/features/auth/pages/SignupPage.tsx`
- 회원가입 폼 로직 핵심 파일.
- `소속실` 제거, `비밀번호` 추가, 사원번호 5자리 검증, 가입 후 자동 로그인/자동 홈 이동 등 핵심 흐름이 들어 있다.
- 관리자 URL에서 `next`를 유지하는 흐름도 중요하다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/src/shared/state/accounts.ts`
- 회원가입 계정 저장소.
- 사원번호/이메일/비밀번호/이름/조직/권한 등의 구조를 담당한다.
- 로그인 방식이 바뀌었을 때 함께 수정되었다.
- 관리자 회원 관리 화면도 이 데이터를 읽고 수정한다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/src/shared/state/profile.ts`
- 현재 로그인 사용자 프로필 상태를 저장한다.
- 우측 상단 프로필 유지, 이름/조직 표시와 관련된다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/src/shared/state/questionBank.ts`
- 관리자 문항 관리와 진단 페이지가 공유하는 질문 저장소다.
- 질문 CRUD 후 실제 진단에 반영되게 하는 핵심 상태 파일이다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/src/shared/state/boards.ts`
- 공지사항 / FAQ 데이터 저장소.
- 홈 하단 공지/FAQ와 관리자 보드 관리가 이 파일을 통해 연결된다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/src/shared/api/learningApi.ts`
- 추천 과정 데이터 소스와 연결되는 파일.
- 추천 엔진/과정 관리/학습 이력과 간접적으로 연결되어 있다.
- 관리자 과정 관리 수정이 실제 추천에 반영되는 흐름을 볼 때 중요하다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/src/features/admin/adminData.ts`
- 관리자 페이지 각 화면에 들어가는 실데이터 스냅샷을 조립한다.
- 가입 회원, 진단 기록, 추천 과정, 신청 이력, 공지/FAQ 등을 모아서 관리자 대시보드/분석에 공급한다.
- 관리자 실데이터가 이상하면 이 파일을 먼저 의심한다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/src/features/admin/components/AdminModal.tsx`
- 관리자 CRUD를 prompt/alert 대신 페이지 내부 모달 폼으로 바꾸면서 추가된 공통 모달.
- 필드 검증 에러/저장 버튼 비활성화/폼 구조와 관련된 핵심 파일.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/src/features/admin/components/AdminFormFields.tsx`
- 관리자 폼 공통 필드 렌더러.
- `required`, `hint` 표시를 붙이면서 중요해졌다.
- 라벨/힌트/오류 메시지 톤을 볼 때 이 파일을 본다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/src/features/admin/components/AdminToast.tsx`
- 관리자 화면 저장/삭제/내보내기 성공 피드백용 공통 토스트.
- 관리 UX 완성도에 중요하다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/src/features/admin/pages/AdminDashboardPage.tsx`
- 관리자 첫 화면.
- KPI/빠른 이동/운영 메모/토스트 등 첫 진입 경험과 관련된다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/src/features/admin/pages/AdminDepartmentsPage.tsx`
- 부서 분석 페이지 로직.
- 검색/CSV/운영 분석 데이터 연결과 관련된다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/src/features/admin/pages/AdminQuestionsPage.tsx`
- 문항 CRUD, 검색, CSV, 검증, 토스트의 중심 파일.
- 중복 문항 방지 로직이 들어 있다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/src/features/admin/pages/AdminCoursesPage.tsx`
- 과정 CRUD, 검색, CSV, 검증, 토스트의 중심 파일.
- 중복 과정명 방지 로직이 들어 있다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/src/features/admin/pages/AdminUsersPage.tsx`
- 회원 수정/권한 변경/삭제/필터/CSV의 중심 파일.
- 현재 로그인 사용자 수정 시 우측 상단 프로필 반영까지 신경 써야 한다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/src/features/admin/pages/AdminBoardsPage.tsx`
- 공지/FAQ CRUD와 홈 연결의 중심 파일.
- 동일 제목/질문 중복 방지 로직이 있다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/src/features/admin/pages/AdminSettingsPage.tsx`
- 관리자 시스템 설정/스냅샷/JSON 내보내기/빠른 이동 담당 파일.
- 관리자 영역이 커지면서 추가된 페이지다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/public/stitch-runtime/01-home.html`
- 홈의 히어로 카피와 기본 디자인 원본.
- 카피가 여러 번 수정되었으므로, 사용자의 최종 문구를 보존해야 한다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/public/stitch-runtime/02-diagnosis.html`
- 진단 페이지 원본.
- 선택지 1x4 배치, `진단 영역` 문구, 우측 진행 카드 등 시각 요소가 반영되어 있다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/public/stitch-runtime/03-diagnosis-results.html`
- 결과 분석 원본.
- CTA, 버튼 스타일, 요약 카드 등이 여기서 first-paint된다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/public/stitch-runtime/04-learning-path.html`
- 학습 경로 원본.
- 하단 저장/수강신청 바가 있었고, 이후 제거된 중요한 히스토리가 있는 파일이다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/public/stitch-runtime/05-recommendation.html`
- 추천 원본.
- 중앙 더미 프로필 제거, 추천 카드 레이아웃, 필터 표현 등을 stitch 측면에서 조정한 파일이다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/public/stitch-runtime/06-course-linking.html`
- 교육 신청 연동 원본.
- 버튼 문구와 우측 패널 표현이 여러 차례 수정되었다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/public/stitch-runtime/07-history.html`
- 나의 학습 이력 원본.
- 추천 과정 수/추천 학습 시간/그래프 라벨/버튼 문구 등 더미 텍스트를 없애는 작업이 들어갔다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/public/stitch-runtime/08-analytics.html`
- 운영 분석 원본.
- 관리자/운영 문맥에 맞게 first-paint 한국어화와 구조 정리가 들어갔다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/public/stitch-runtime/09-chatbot.html`
- 커뮤니티 원본.
- 채팅 높이, 하단 여백, 아이콘, 안내문구, 우측 패널, 빈 박스 로고 등 사용자가 가장 많이 미세조정한 stitch 파일 중 하나다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/public/stitch-runtime/10-platform-intro.html`
- 플랫폼 소개 원본.
- 히어로 제거, 비전/본문 문구 수정 등 정보 페이지 성격으로 정리되었다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/public/stitch-runtime/11-admin-dashboard.html`
- 관리자 대시보드 stitch 원본.
- first-paint 한국어화가 적용된 파일이다.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/public/stitch-runtime/14-admin-courses.html`
- 관리자 과정 관리 stitch 원본.
- first-paint 한국어화 적용.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/public/stitch-runtime/15-admin-users.html`
- 관리자 회원 관리 stitch 원본.
- first-paint 한국어화 적용.

### `/Users/daniel/내 작업/내 프로젝트/Vibe Coding/On_Learning_Searcher/public/stitch-runtime/16-admin-boards.html`
- 관리자 공지/FAQ 관리 stitch 원본.
- first-paint 한국어화 적용.

## 2026-03-08 오케스트레이터 복귀 메모
- 이번 대화부터는 다시 `AGENTS.md`의 원칙대로 orchestrator-only로 복귀했다.
- 즉, 더 이상 메인 워크트리에서 직접 기능 구현을 이어가지 않는 것이 기준이다.
- 확인 시점 기준 모든 병렬 워크트리는 살아 있지만, 각 워크트리는 아직 `ahead 0 / behind 0 / dirty NO` 상태이며 첫 기능 커밋이 없다.
- 반대로 메인 워크트리에는 이전 직접 구현 세션의 변경이 많이 누적되어 있어, 현재 최우선 과제는 "메인 변경을 워크트리별로 회수해서 병렬 구조를 복구하는 것"이다.
- 이를 위해 `ORCHESTRATION/WORKTREE_RECOVERY_PLAN_2026-03-08.md`를 새 기준 문서로 추가했다.
- 다음 세션에서도 직접 구현보다 먼저 아래 순서를 따라야 한다:
  1. worktree 상태 확인
  2. stale checkin 갱신
  3. recovery plan 기준으로 워크트리별 작업 하달
  4. 각 워크트리 첫 기능 커밋 회수
  5. 그 다음에만 순차 머지 검토
