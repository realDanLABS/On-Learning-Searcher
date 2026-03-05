import { sanitizeAuditDetail } from '../security/privacy'

export type AuditAction =
  | 'login'
  | 'logout'
  | 'profile_saved'
  | 'role_changed'
  | 'diagnosis_submitted'
  | 'course_selected'
  | 'enrollment_submitted'
  | 'session_expired'
  | 'journey_reset'
  | 'header_next_action'
  | 'chatbot_prompt'
  | 'chatbot_action'

export type AuditRecord = {
  id: string
  action: AuditAction
  at: string
  detail: string
}

const KEY_AUDIT_LOGS = 'on_learning_audit_logs_v1'
const RETENTION_DAYS = 90

export function appendAuditLog(action: AuditAction, detail: string) {
  const current = getAuditLogs()
  const now = new Date().toISOString()
  const next: AuditRecord = {
    id: `${action}-${now}-${Math.random().toString(36).slice(2, 8)}`,
    action,
    at: now,
    detail: sanitizeAuditDetail(detail),
  }
  localStorage.setItem(KEY_AUDIT_LOGS, JSON.stringify([next, ...current].slice(0, 200)))
}

export function getAuditLogs(): AuditRecord[] {
  const raw = localStorage.getItem(KEY_AUDIT_LOGS)
  if (!raw) return []
  try {
    const all = JSON.parse(raw) as AuditRecord[]
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS)
    const kept = all.filter((item) => new Date(item.at) >= cutoff)
    if (kept.length !== all.length) {
      localStorage.setItem(KEY_AUDIT_LOGS, JSON.stringify(kept))
    }
    return kept
  } catch {
    return []
  }
}

export function clearAuditLogs() {
  localStorage.removeItem(KEY_AUDIT_LOGS)
}
