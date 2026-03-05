import type { CategoryScores } from '../state/learningFlow'

export type SkillGapItem = {
  key: keyof CategoryScores
  label: string
  score: number
  relativePercent: number
  status: 'critical' | 'watch' | 'strong'
}

const categoryLabels: Record<keyof CategoryScores, string> = {
  digital: '디지털 활용',
  leadership: '리더십',
  collaboration: '협업',
  problemSolving: '문제해결',
}

function resolveStatus(relativePercent: number): SkillGapItem['status'] {
  if (relativePercent < 40) return 'critical'
  if (relativePercent < 70) return 'watch'
  return 'strong'
}

export function buildSkillGapItems(scores: CategoryScores): SkillGapItem[] {
  const entries = Object.entries(scores) as Array<[keyof CategoryScores, number]>
  const max = Math.max(...entries.map(([, value]) => value), 1)
  return entries
    .map(([key, score]) => {
      const relativePercent = Math.round((score / max) * 100)
      return {
        key,
        label: categoryLabels[key],
        score,
        relativePercent,
        status: resolveStatus(relativePercent),
      }
    })
    .sort((a, b) => a.score - b.score)
}
