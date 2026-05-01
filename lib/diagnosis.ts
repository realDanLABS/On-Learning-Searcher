import type { CategoryScores, CompetencyAreaKey } from '@/lib/learning-client'

export type ChoiceValue = 1 | 2 | 3 | 4

export type DiagnosisQuestion = {
  id: string
  title: string
  type: 'choice'
  options: Array<{ label: string; value: ChoiceValue }>
  category: CompetencyAreaKey
}

export type AnswerMap = Record<string, number>

export const competencyAreaLabels: Record<CompetencyAreaKey, string> = {
  aiAutomation: 'AI/자동화 활용',
  dataDecision: '데이터 기반 의사결정',
  dxInnovation: 'DX 혁신 이해',
  operationsQualitySafety: '생산/품질/안전 운영',
  problemCollaboration: '문제해결/협업',
}

const agreementOptions = [
  { label: '전혀 그렇지 않다', value: 1 as ChoiceValue },
  { label: '가끔 그렇다', value: 2 as ChoiceValue },
  { label: '대체로 그렇다', value: 3 as ChoiceValue },
  { label: '항상 그렇다', value: 4 as ChoiceValue },
]

const capabilityOptions = [
  { label: '전혀 못한다', value: 1 as ChoiceValue },
  { label: '도움이 필요하다', value: 2 as ChoiceValue },
  { label: '기본적으로 할 수 있다', value: 3 as ChoiceValue },
  { label: '실무에 자신 있다', value: 4 as ChoiceValue },
]

const experienceOptions = [
  { label: '경험이 없다', value: 1 as ChoiceValue },
  { label: '간단히 경험해봤다', value: 2 as ChoiceValue },
  { label: '업무에 적용해봤다', value: 3 as ChoiceValue },
  { label: '반복적으로 활용 중이다', value: 4 as ChoiceValue },
]

export const diagnosisQuestions: DiagnosisQuestion[] = [
  { id: 'q1', title: '반복적으로 발생하는 보고, 정리, 전달 업무를 줄이기 위해 AI 도구나 자동화 방식을 떠올릴 수 있다.', type: 'choice', options: agreementOptions, category: 'aiAutomation' },
  { id: 'q2', title: '회의록, 메일 초안, 보고서 요약 등 사무 업무를 AI 도구로 보조해 본 경험이 있다.', type: 'choice', options: experienceOptions, category: 'aiAutomation' },
  { id: 'q3', title: 'AI가 만든 결과물을 그대로 쓰지 않고 현업 기준에 맞게 검토하고 수정할 수 있다.', type: 'choice', options: capabilityOptions, category: 'aiAutomation' },
  { id: 'q4', title: '업무 생산성을 높이기 위해 어떤 프로세스를 자동화할지 스스로 제안할 수 있다.', type: 'choice', options: capabilityOptions, category: 'aiAutomation' },
  { id: 'q5', title: '업무 판단이 필요할 때 경험이나 감보다 데이터 근거를 먼저 확인하는 편이다.', type: 'choice', options: agreementOptions, category: 'dataDecision' },
  { id: 'q6', title: '엑셀, 차트, 통계 도구 등을 활용해 생산, 품질, 비용 데이터를 정리할 수 있다.', type: 'choice', options: capabilityOptions, category: 'dataDecision' },
  { id: 'q7', title: '수치 결과를 보고 원인, 패턴, 이상 징후를 해석해 실행 방안으로 연결할 수 있다.', type: 'choice', options: capabilityOptions, category: 'dataDecision' },
  { id: 'q8', title: '데이터 분석 결과를 현업 담당자나 리더가 이해하기 쉽게 설명할 수 있다.', type: 'choice', options: capabilityOptions, category: 'dataDecision' },
  { id: 'q9', title: '디지털 전환이 제조 현장, 사무 업무, 협업 방식에 어떤 변화를 주는지 설명할 수 있다.', type: 'choice', options: capabilityOptions, category: 'dxInnovation' },
  { id: 'q10', title: '현재 업무 프로세스를 디지털 방식으로 바꿔볼 개선 아이디어를 제안할 수 있다.', type: 'choice', options: capabilityOptions, category: 'dxInnovation' },
  { id: 'q11', title: '새로운 시스템이나 업무 방식이 도입될 때 비교적 빠르게 적응하는 편이다.', type: 'choice', options: agreementOptions, category: 'dxInnovation' },
  { id: 'q12', title: '디지털 도입 과제를 논의할 때 현업 부서와 IT/기획 부서 사이에서 공통 언어로 소통할 수 있다.', type: 'choice', options: capabilityOptions, category: 'dxInnovation' },
  { id: 'q13', title: '생산, 품질, 설비, 안전 관련 지표를 업무와 연결해 이해하고 있다.', type: 'choice', options: capabilityOptions, category: 'operationsQualitySafety' },
  { id: 'q14', title: '현장 이슈가 발생하면 원인 파악과 재발방지 관점에서 문제를 정리하는 편이다.', type: 'choice', options: agreementOptions, category: 'operationsQualitySafety' },
  { id: 'q15', title: '품질 기준, 표준 절차, 안전보건 요구사항을 업무 수행 전에 먼저 확인하는 편이다.', type: 'choice', options: agreementOptions, category: 'operationsQualitySafety' },
  { id: 'q16', title: '생산성과 품질을 함께 높이기 위한 개선 포인트를 제안하거나 실행한 경험이 있다.', type: 'choice', options: experienceOptions, category: 'operationsQualitySafety' },
  { id: 'q17', title: '문제가 생기면 바로 해결책부터 말하기보다 먼저 문제를 명확히 정의하는 편이다.', type: 'choice', options: agreementOptions, category: 'problemCollaboration' },
  { id: 'q18', title: '타 부서와 협업할 때 상대의 제약 조건과 입장을 확인하며 조율할 수 있다.', type: 'choice', options: capabilityOptions, category: 'problemCollaboration' },
  { id: 'q19', title: '회의나 협업 상황에서 질문, 피드백, 정리 역할을 자주 수행하는 편이다.', type: 'choice', options: agreementOptions, category: 'problemCollaboration' },
  { id: 'q20', title: '복잡한 문제를 해결할 때 원인 분석, 대안 도출, 실행 계획 순서로 접근한다.', type: 'choice', options: capabilityOptions, category: 'problemCollaboration' },
]

const KEY_DIAGNOSIS_DRAFT = 'on-learning-diagnosis-answers-v1'

export function createEmptyCategoryScores(): CategoryScores {
  return {
    aiAutomation: 0,
    dataDecision: 0,
    dxInnovation: 0,
    operationsQualitySafety: 0,
    problemCollaboration: 0,
  }
}

export function loadDiagnosisDraft(): AnswerMap {
  if (typeof window === 'undefined') return {}
  const raw = localStorage.getItem(KEY_DIAGNOSIS_DRAFT)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as AnswerMap
  } catch {
    localStorage.removeItem(KEY_DIAGNOSIS_DRAFT)
    return {}
  }
}

export function saveDiagnosisDraft(answers: AnswerMap) {
  localStorage.setItem(KEY_DIAGNOSIS_DRAFT, JSON.stringify(answers))
}

export function clearDiagnosisDraft() {
  localStorage.removeItem(KEY_DIAGNOSIS_DRAFT)
}

export function buildSummary(answers: AnswerMap) {
  const maxScore = diagnosisQuestions.length * 4
  const totalScore = diagnosisQuestions.reduce((sum, q) => sum + (answers[q.id] ?? 0), 0)
  const level = totalScore >= 60 ? '심화' : totalScore >= 40 ? '성장' : '기초'

  const categoryScores = diagnosisQuestions.reduce<Record<CompetencyAreaKey, number>>((acc, q) => {
    acc[q.category] += answers[q.id] ?? 0
    return acc
  }, createEmptyCategoryScores())

  const sorted = Object.entries(categoryScores).sort((a, b) => b[1] - a[1])
  return {
    totalScore,
    maxScore,
    level,
    strengths: sorted.slice(0, 2).map(([key]) => competencyAreaLabels[key as CompetencyAreaKey]),
    growthArea: competencyAreaLabels[sorted[sorted.length - 1][0] as CompetencyAreaKey],
    categoryScores,
  }
}

export function getTopGapLabel(answers: AnswerMap) {
  const categoryScores = diagnosisQuestions.reduce((acc, question) => {
    acc[question.category] += answers[question.id] ?? 0
    return acc
  }, createEmptyCategoryScores())

  const topGap = (Object.entries(categoryScores) as Array<[CompetencyAreaKey, number]>)
    .sort((left, right) => left[1] - right[1])[0]?.[0]

  return topGap ? competencyAreaLabels[topGap] : '디지털 리터러시'
}
