# 페이지 간 연동 계약 (MVP)

## Diagnosis -> Recommendation
payload:
- `userId: string`
- `diagnosedAt: string (ISO)`
- `totalScore: number`
- `categoryScores: { digital: number, leadership: number, collaboration: number, problemSolving: number }`
- `topGaps: string[]`

## Recommendation -> Course Linking
payload:
- `courseId: string`
- `courseTitle: string`
- `reasonTags: string[]`
- `recommendedBy: "skill-gap" | "role-fit" | "history-based"`

## Course Linking -> History
payload:
- `courseId: string`
- `enrollmentRequestedAt: string (ISO)`
- `enrollmentStatus: "requested" | "enrolled" | "failed"`

## Chatbot cross-link
- 추천 이유 설명 시 `recommendation` deep-link 제공
- 학습 진척 질문 시 `history` deep-link 제공
