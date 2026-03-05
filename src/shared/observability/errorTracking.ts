import { runtimeConfig } from '../config/runtime'

type ErrorPayload = {
  at: string
  message: string
  source: string
}

export function setupGlobalErrorTracking() {
  window.addEventListener('error', (event) => {
    void reportError({
      at: new Date().toISOString(),
      message: event.message || 'window error',
      source: 'window.error',
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    const message = reason instanceof Error ? reason.message : String(reason)
    void reportError({
      at: new Date().toISOString(),
      message,
      source: 'window.unhandledrejection',
    })
  })
}

export async function reportError(payload: ErrorPayload) {
  if (!runtimeConfig.errorReportUrl) {
    return
  }
  try {
    await fetch(runtimeConfig.errorReportUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    })
  } catch {
    // reporting failure should not interrupt app flow
  }
}

