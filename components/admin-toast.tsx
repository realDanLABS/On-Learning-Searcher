'use client'

export function AdminToast({
  message,
  tone = 'info',
  onClose,
}: {
  message: string
  tone?: 'info' | 'success' | 'warning' | 'danger'
  onClose: () => void
}) {
  return (
    <div aria-live="polite" className={`admin-toast admin-toast-${tone}`} role="status">
      <span className="admin-toast-message">{message}</span>
      <button aria-label="알림 닫기" className="admin-toast-close" onClick={onClose} type="button">
        닫기
      </button>
    </div>
  )
}
