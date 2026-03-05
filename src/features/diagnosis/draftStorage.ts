import type { AnswerMap } from './diagnosisResult'

const KEY_DIAGNOSIS_DRAFT = 'on-learning-diagnosis-answers-v1'

export function loadDiagnosisDraft(): AnswerMap {
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

export function hasDiagnosisDraft() {
  return Object.keys(loadDiagnosisDraft()).length > 0
}
