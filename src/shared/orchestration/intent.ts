import { sanitizeInternalPath } from './safePath'

const KEY_PENDING_NEXT_PATH = 'on_learning_pending_next_path_v1'

export function savePendingNextPath(path: string | null | undefined) {
  const safePath = sanitizeInternalPath(path)
  if (!safePath) return
  sessionStorage.setItem(KEY_PENDING_NEXT_PATH, safePath)
}

export function getPendingNextPath(): string | null {
  return sanitizeInternalPath(sessionStorage.getItem(KEY_PENDING_NEXT_PATH))
}

export function clearPendingNextPath() {
  sessionStorage.removeItem(KEY_PENDING_NEXT_PATH)
}

export function consumePendingNextPath(): string | null {
  const current = getPendingNextPath()
  clearPendingNextPath()
  return current
}
