import { clearAuthentication } from '../state/auth'
import { appendAuditLog } from '../observability/audit'

const SESSION_EXPIRED_EVENT = 'on-learning:session-expired'
const KEY_SESSION_EXPIRED_NOTICE = 'on_learning_session_expired_notice_v1'

export function emitSessionExpiredNotice() {
  clearAuthentication()
  appendAuditLog('session_expired', '세션 만료 감지로 인증 상태 해제')
  localStorage.setItem(KEY_SESSION_EXPIRED_NOTICE, '1')
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
}

export function consumeSessionExpiredNotice() {
  const hasNotice = localStorage.getItem(KEY_SESSION_EXPIRED_NOTICE) === '1'
  if (hasNotice) {
    localStorage.removeItem(KEY_SESSION_EXPIRED_NOTICE)
  }
  return hasNotice
}

export function subscribeSessionExpired(callback: () => void): () => void {
  const handler = () => callback()
  window.addEventListener(SESSION_EXPIRED_EVENT, handler)
  return () => {
    window.removeEventListener(SESSION_EXPIRED_EVENT, handler)
  }
}
