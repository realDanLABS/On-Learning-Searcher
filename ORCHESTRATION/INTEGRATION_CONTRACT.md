# 페이지 간 연동 계약 (Commercialization Baseline)

## 1. Diagnosis -> Recommendation
payload:
- `userId: string`
- `diagnosedAt: string (ISO)`
- `totalScore: number`
- `maxScore: number`
- `levelLabel: "기초" | "성장" | "심화"`
- `categoryScores: {`
  - `aiAutomation: number`
  - `dataDecision: number`
  - `dxInnovation: number`
  - `operationsQualitySafety: number`
  - `problemCollaboration: number`
  - `}`
- `topGaps: Array<"aiAutomation" | "dataDecision" | "dxInnovation" | "operationsQualitySafety" | "problemCollaboration">`
- `strengthAreas: Array<"aiAutomation" | "dataDecision" | "dxInnovation" | "operationsQualitySafety" | "problemCollaboration">`
- `recommendedFocusSummary: string`
- `resultSnapshotId: string`

설명:
- recommendation, history, chatbot은 모두 같은 `topGaps`, `strengthAreas`, `levelLabel`을 기준으로 문구를 생성한다.
- 재진단 비교 시에는 `resultSnapshotId`를 기준으로 직전 결과와 비교한다.

## 2. Recommendation -> Course Linking
payload:
- `courseId: string`
- `courseTitle: string`
- `competencyArea: "aiAutomation" | "dataDecision" | "dxInnovation" | "operationsQualitySafety" | "problemCollaboration"`
- `reasonTags: string[]`
- `priorityTier: "1순위 보완" | "2순위 보완" | "3순위 보완" | "확장 추천"`
- `difficultyLabel: "입문" | "중급" | "심화"`
- `difficultyFit: "난이도 적합" | "권장 난이도 입문" | "권장 난이도 중급" | "권장 난이도 심화"`
- `recommendedBy: "skill-gap" | "role-fit" | "history-based"`
- `summary: string`
- `expectedOutcomes: string[]`
- `targetAudience: string[]`

설명:
- recommendation 화면은 신청 전 의사결정에 필요한 설명을 모두 이 payload에서 제공한다.
- course-linking은 동일 payload를 재사용해 과정 상세와 신청 설득 영역을 구성한다.

## 3. Course Linking -> History
payload:
- `courseId: string`
- `courseTitle: string`
- `enrollmentRequestedAt: string (ISO)`
- `enrollmentStatus: "requested" | "enrolled" | "failed" | "return-missing"`
- `ecampusUrl?: string`
- `returnToken?: string`
- `learningPlanSummary: string[]`
- `learningCalendarMilestones: string[]`

설명:
- `return-missing`은 외부 이동 후 복귀 이벤트가 누락된 상태를 의미한다.
- history와 chatbot은 신청 상태를 같은 의미로 읽어야 하므로 상태값 추가 시 동시에 반영한다.

## 4. History -> Chatbot
payload:
- `latestDiagnosisSnapshotId: string`
- `latestEnrollmentStatus: "requested" | "enrolled" | "failed" | "return-missing"`
- `activeCourseId?: string`
- `activeCourseTitle?: string`
- `favoriteCourseIds: string[]`
- `nextRecommendedAction: "resume-diagnosis" | "view-recommendation" | "apply-course" | "check-history"`

설명:
- chatbot은 사용자의 현재 단계와 다음 액션을 이 계약에 맞춰 응답한다.
- 홈 화면의 이어가기 카드도 동일 `nextRecommendedAction` 의미를 공유한다.

## 5. 관리자 요약 계약
payload:
- `departmentBenchmarks: Array<{ department: string, score: number, completionRate: number, enrollmentRate: number }>`
- `dropoffSignals: Array<{ stage: "diagnosis" | "recommendation" | "course-linking", rate: number, hypothesis: string }>`
- `suggestedActions: Array<{ title: string, owner: string, priority: "high" | "medium" | "low" }>`

설명:
- history 관리자 화면과 향후 운영 리포트 다운로드는 동일 요약 계약을 재사용한다.

## 6. Chatbot Cross-link Rules
- 추천 이유 설명 시 `recommendation` deep-link 제공
- 학습 진척 질문 시 `history` deep-link 제공
- 신청 관련 질문 시 `course-linking` deep-link 제공
- 저장 과정 / 이어가기 질문 시 `home` 또는 `recommendation` deep-link 제공
