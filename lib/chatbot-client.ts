'use client'

import { runtime } from '@/lib/runtime'
import type { DiagnosisPayload, EnrollmentRecord, RecommendedCourse } from '@/lib/learning-client'

export type ChatbotReplyContext = {
  question: string
  diagnosis: DiagnosisPayload | null
  enrollments: EnrollmentRecord[]
  courses: RecommendedCourse[]
  profile: {
    name: string
    organization: string
    employeeId?: string
  } | null
}

export async function fetchChatbotReply(context: ChatbotReplyContext) {
  const response = await fetch(`${runtime.apiBaseUrl}/chatbot/reply`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(context),
  })

  if (!response.ok) {
    let message = `API request failed: ${response.status}`
    try {
      const payload = (await response.json()) as { error?: { message?: string } }
      message = payload.error?.message || message
    } catch {
      // ignore
    }
    throw new Error(message)
  }

  return response.json() as Promise<{ answer: string }>
}
