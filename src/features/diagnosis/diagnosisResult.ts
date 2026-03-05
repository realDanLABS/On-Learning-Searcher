import { diagnosisQuestions } from './questions'

export type AnswerMap = Record<string, number>

export type DiagnosisSummary = {
  totalScore: number
  maxScore: number
  level: '기초' | '성장' | '심화'
  strengths: string[]
  growthArea: string
}

const categoryLabel: Record<string, string> = {
  digital: '디지털 활용',
  leadership: '리더십',
  collaboration: '협업',
  'problem-solving': '문제 해결',
}

export function buildSummary(answers: AnswerMap): DiagnosisSummary {
  const maxScore = diagnosisQuestions.length * 2
  const totalScore = diagnosisQuestions.reduce(
    (sum, q) => sum + (answers[q.id] ?? 0),
    0,
  )

  const level =
    totalScore >= 16 ? '심화' : totalScore >= 10 ? '성장' : '기초'

  const categoryScores = diagnosisQuestions.reduce<Record<string, number>>(
    (acc, q) => {
      acc[q.category] = (acc[q.category] ?? 0) + (answers[q.id] ?? 0)
      return acc
    },
    {},
  )

  const sorted = Object.entries(categoryScores).sort((a, b) => b[1] - a[1])
  const strengths = sorted.slice(0, 2).map(([key]) => categoryLabel[key])
  const growthArea = categoryLabel[sorted[sorted.length - 1][0]]

  return { totalScore, maxScore, level, strengths, growthArea }
}
