const KEY_PENDING_NEXT_PATH = 'on_learning_pending_next_path_v1'

export function savePendingNextPath(path: string | null | undefined) {
  if (!path) return
  sessionStorage.setItem(KEY_PENDING_NEXT_PATH, path)
}

export function getPendingNextPath(): string | null {
  return sessionStorage.getItem(KEY_PENDING_NEXT_PATH)
}

export function clearPendingNextPath() {
  sessionStorage.removeItem(KEY_PENDING_NEXT_PATH)
}

export function consumePendingNextPath(): string | null {
  const current = getPendingNextPath()
  clearPendingNextPath()
  return current
}
