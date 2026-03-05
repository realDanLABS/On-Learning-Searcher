import { sanitizeInternalPath } from './safePath'

const KEY_PENDING_NEXT_PATH = 'on_learning_pending_next_path_v1'
let memoryPendingNextPath: string | null = null

function safeSet(path: string) {
  try {
    sessionStorage.setItem(KEY_PENDING_NEXT_PATH, path)
    memoryPendingNextPath = null
    return
  } catch {
    memoryPendingNextPath = path
  }
}

function safeGet() {
  try {
    return sessionStorage.getItem(KEY_PENDING_NEXT_PATH)
  } catch {
    return memoryPendingNextPath
  }
}

function safeRemove() {
  try {
    sessionStorage.removeItem(KEY_PENDING_NEXT_PATH)
  } catch {
    // ignore and continue fallback cleanup
  }
  memoryPendingNextPath = null
}

export function savePendingNextPath(path: string | null | undefined) {
  const safePath = sanitizeInternalPath(path)
  if (!safePath) return
  safeSet(safePath)
}

export function getPendingNextPath(): string | null {
  return sanitizeInternalPath(safeGet())
}

export function clearPendingNextPath() {
  safeRemove()
}

export function consumePendingNextPath(): string | null {
  const current = getPendingNextPath()
  clearPendingNextPath()
  return current
}
