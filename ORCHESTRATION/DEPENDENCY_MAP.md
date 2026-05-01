# Dependency Map

## 핵심 원칙
- foundation이 공통 UX 패턴을 먼저 고정해야 recommendation / history / responsive가 흔들리지 않는다.
- diagnosis 결과 계약이 recommendation / history / chatbot의 공통 입력이다.
- course-linking의 신청 상태 정의는 history / chatbot / 운영 리포트의 공통 입력이다.

## 선행 순서
1. foundation
2. diagnosis
3. recommendation
4. course-linking
5. history
6. chatbot
7. responsive

## 상세 의존성

### foundation -> recommendation
- 공통 카드 / 배지 / 액션 패턴 확정 필요
- 홈 이어가기와 추천 저장 동선 의미 일치 필요

### diagnosis -> recommendation
- `topGaps`
- `strengthAreas`
- `levelLabel`
- `resultSnapshotId`

### diagnosis -> history
- 재진단 전후 비교용 스냅샷 필드 필요
- 결과 단계 설명 문구 기준 일치 필요

### diagnosis -> chatbot
- 부족 역량 / 강점 / 다음 추천 이유 설명용 공통 필드 필요

### recommendation -> course-linking
- `courseId`
- `courseTitle`
- `competencyArea`
- `priorityTier`
- `difficultyFit`
- `expectedOutcomes`

### course-linking -> history
- `enrollmentStatus`
- `learningPlanSummary`
- `learningCalendarMilestones`

### course-linking -> chatbot
- 현재 선택 과정 / 신청 상태 / 다음 액션 필요

### history -> chatbot
- 최신 성장 변화 / 활성 과정 / 다음 액션 공유 필요

### foundation -> responsive
- 공통 그리드 / 공통 상태 컴포넌트가 먼저 안정돼야 해상도별 축소 규칙을 잡기 쉬움

### recommendation + history + chatbot -> responsive
- 저장 카드
- 비교 패널
- 관리자 그리드
- 3열 챗봇 구조

## 병렬 작업 가능한 묶음

### 묶음 A
- foundation
- diagnosis

이유:
- 공통 UX 패턴과 결과 계약이 먼저 잡혀야 이후 페이지가 안정된다.

### 묶음 B
- recommendation
- course-linking

이유:
- 추천 설명과 신청 상태 계약은 함께 맞춰야 전환 UX가 자연스럽다.

### 묶음 C
- history
- chatbot

이유:
- 성장 추적과 맥락형 상담은 같은 요약 데이터 소스를 공유한다.

### 묶음 D
- responsive

이유:
- 나머지 구조가 어느 정도 고정된 뒤 전체 QA가 가장 효율적이다.
