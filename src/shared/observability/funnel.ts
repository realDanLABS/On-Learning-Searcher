import { getJourneyEvents, type JourneyEvent } from '../state/learningFlow'

export type FunnelSnapshot = {
  diagnosisCompleted: number
  courseSelected: number
  enrollmentCompleted: number
  conversionToSelection: number
  conversionToEnrollment: number
  dropOffAfterDiagnosis: number
  dropOffAfterSelection: number
}

export type WeeklyConversionPoint = {
  date: string
  diagnosisCompleted: number
  enrollmentCompleted: number
}

function percent(base: number, target: number) {
  if (base === 0) return 0
  return Math.round((target / base) * 100)
}

export function getFunnelSnapshot(): FunnelSnapshot {
  return buildFunnelSnapshotFromEvents(getJourneyEvents())
}

export function buildFunnelSnapshotFromEvents(events: JourneyEvent[]): FunnelSnapshot {
  const diagnosisCompleted = events.filter((e) => e.type === 'diagnosis_completed').length
  const courseSelected = events.filter((e) => e.type === 'course_selected').length
  const enrollmentCompleted = events.filter((e) => e.type === 'enrollment_completed').length

  return {
    diagnosisCompleted,
    courseSelected,
    enrollmentCompleted,
    conversionToSelection: percent(diagnosisCompleted, courseSelected),
    conversionToEnrollment: percent(diagnosisCompleted, enrollmentCompleted),
    dropOffAfterDiagnosis: Math.max(0, diagnosisCompleted - courseSelected),
    dropOffAfterSelection: Math.max(0, courseSelected - enrollmentCompleted),
  }
}

export function getWeeklyConversionSeries(days = 7, now = new Date()): WeeklyConversionPoint[] {
  return buildWeeklyConversionSeriesFromEvents(getJourneyEvents(), days, now)
}

export function buildWeeklyConversionSeriesFromEvents(
  events: JourneyEvent[],
  days = 7,
  now = new Date(),
): WeeklyConversionPoint[] {
  const dayKeys = Array.from({ length: days }).map((_, index) => {
    const date = new Date(now)
    date.setDate(now.getDate() - (days - 1 - index))
    return date.toISOString().slice(0, 10)
  })

  return dayKeys.map((key) => ({
    date: key,
    diagnosisCompleted: events.filter((event) => event.type === 'diagnosis_completed' && event.at.startsWith(key))
      .length,
    enrollmentCompleted: events.filter((event) => event.type === 'enrollment_completed' && event.at.startsWith(key))
      .length,
  }))
}
