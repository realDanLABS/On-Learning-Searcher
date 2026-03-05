const SESSION_EXPIRED_EVENT = 'on-learning:session-expired'
const KEY_SESSION_EXPIRED_NOTICE = 'on_learning_session_expired_notice_v1'

export function emitSessionExpiredNotice() {
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

