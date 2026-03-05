import { getJourneyEvents } from '../state/learningFlow'

export type FunnelSnapshot = {
  diagnosisCompleted: number
  courseSelected: number
  enrollmentCompleted: number
  conversionToSelection: number
  conversionToEnrollment: number
}

function percent(base: number, target: number) {
  if (base === 0) return 0
  return Math.round((target / base) * 100)
}

export function getFunnelSnapshot(): FunnelSnapshot {
  const events = getJourneyEvents()
  const diagnosisCompleted = events.filter((e) => e.type === 'diagnosis_completed').length
  const courseSelected = events.filter((e) => e.type === 'course_selected').length
  const enrollmentCompleted = events.filter((e) => e.type === 'enrollment_completed').length

  return {
    diagnosisCompleted,
    courseSelected,
    enrollmentCompleted,
    conversionToSelection: percent(diagnosisCompleted, courseSelected),
    conversionToEnrollment: percent(diagnosisCompleted, enrollmentCompleted),
  }
}
