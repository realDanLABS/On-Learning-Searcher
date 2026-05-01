'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type StitchMessage = {
  source?: string
  type?: string
  page?: string
  action?: string
  data?: unknown
  height?: number
}

type StitchFrameProps = {
  file: string
  payload: unknown
  onAction?: (action: string, data: unknown) => void | Promise<void>
  hideEmbeddedHeader?: boolean
}

export function StitchFrame({ file, payload, onAction, hideEmbeddedHeader = false }: StitchFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const mutationObserverRef = useRef<MutationObserver | null>(null)
  const pollingTimerRef = useRef<number | null>(null)
  const [height, setHeight] = useState(720)
  const src = useMemo(() => `/stitch-runtime/${file}`, [file])
  const shouldHideEmbeddedAdminHeader = useMemo(
    () =>
      [
        '11-admin-dashboard.html',
        '12-admin-departments.html',
        '13-admin-questions.html',
        '14-admin-courses.html',
        '15-admin-users.html',
        '16-admin-boards.html',
      ].includes(file),
    [file],
  )
  const shouldHideEmbeddedAdminSidebar = useMemo(
    () =>
      [
        '12-admin-departments.html',
        '13-admin-questions.html',
        '14-admin-courses.html',
        '16-admin-boards.html',
      ].includes(file),
    [file],
  )
  const shouldHideEmbeddedHeaderOnly = useMemo(
    () => hideEmbeddedHeader && !shouldHideEmbeddedAdminHeader,
    [hideEmbeddedHeader, shouldHideEmbeddedAdminHeader],
  )

  const syncEmbeddedAdminChrome = useCallback(() => {
    if (!shouldHideEmbeddedAdminHeader && !shouldHideEmbeddedHeaderOnly) return

    const iframe = iframeRef.current
    const doc = iframe?.contentDocument
    if (!doc) return

    const styleId = 'on-learning-admin-embedded-reset'
    if (!doc.getElementById(styleId)) {
      const style = doc.createElement('style')
      style.id = styleId
      style.textContent = `
        html,
        body {
          height: auto !important;
          min-height: auto !important;
          overflow: visible !important;
          background: #f5f8fb !important;
        }

        body > div,
        body > .layout-container,
        body > .relative,
        body > .flex {
          height: auto !important;
          min-height: auto !important;
          max-height: none !important;
          overflow: visible !important;
        }

        body > header,
        body > .layout-container > header,
        body > div > header,
        body > div > main > header,
        .layout-container > header,
        .layout-container header:first-of-type,
        main > header:first-of-type {
          display: none !important;
        }

        footer {
          display: ${shouldHideEmbeddedAdminHeader ? 'none' : 'block'} !important;
        }

        main {
          width: min(1280px, calc(100% - 48px)) !important;
          max-width: min(1280px, calc(100% - 48px)) !important;
          flex: 1 1 auto !important;
          height: auto !important;
          min-height: auto !important;
          max-height: none !important;
          overflow: visible !important;
          overflow-y: visible !important;
          margin: 0 auto !important;
          padding-top: 24px !important;
          background: transparent !important;
        }

        ${shouldHideEmbeddedAdminSidebar
          ? `
        aside {
          display: none !important;
        }

        .flex.flex-1.flex-col.lg\\:flex-row,
        .flex.flex-1.flex-col,
        .layout-container > .flex {
          display: block !important;
          height: auto !important;
          min-height: auto !important;
          overflow: visible !important;
        }

        .overflow-y-auto,
        .overflow-x-auto,
        .overflow-hidden {
          max-height: none !important;
          height: auto !important;
          overflow: visible !important;
          overflow-y: visible !important;
        }
        `
          : ''}
      `
      doc.head.appendChild(style)
    }
  }, [shouldHideEmbeddedAdminHeader, shouldHideEmbeddedAdminSidebar, shouldHideEmbeddedHeaderOnly])

  const syncIframeHeightFromDocument = useCallback(() => {
    if (!shouldHideEmbeddedAdminHeader && !shouldHideEmbeddedHeaderOnly) return

    const doc = iframeRef.current?.contentDocument
    if (!doc) return

    const candidates = [
      doc.documentElement.scrollHeight,
      doc.body?.scrollHeight ?? 0,
      doc.documentElement.offsetHeight,
      doc.body?.offsetHeight ?? 0,
    ]

    doc.querySelectorAll<HTMLElement>('main, aside, section, article, table, [class*="layout"], [class*="container"]').forEach((node) => {
      const rect = node.getBoundingClientRect()
      candidates.push(Math.ceil(rect.bottom + doc.defaultView!.scrollY))
    })

    const nextHeight = Math.max(...candidates, 320)
    setHeight((current) => (Math.abs(current - nextHeight) > 1 ? nextHeight + 2 : current))
  }, [shouldHideEmbeddedAdminHeader, shouldHideEmbeddedHeaderOnly])

  const bindIframeHeightObservers = useCallback(() => {
    resizeObserverRef.current?.disconnect()
    mutationObserverRef.current?.disconnect()
    if (pollingTimerRef.current) {
      window.clearInterval(pollingTimerRef.current)
      pollingTimerRef.current = null
    }

    if (!shouldHideEmbeddedAdminHeader && !shouldHideEmbeddedHeaderOnly) return

    const doc = iframeRef.current?.contentDocument
    if (!doc?.body) return

    const sync = () => {
      syncEmbeddedAdminChrome()
      syncIframeHeightFromDocument()
    }

    resizeObserverRef.current = new ResizeObserver(sync)
    resizeObserverRef.current.observe(doc.body)

    mutationObserverRef.current = new MutationObserver(sync)
    mutationObserverRef.current.observe(doc.body, {
      subtree: true,
      childList: true,
      attributes: true,
      characterData: true,
    })

    pollingTimerRef.current = window.setInterval(sync, 250)
    sync()
  }, [shouldHideEmbeddedAdminHeader, shouldHideEmbeddedHeaderOnly, syncEmbeddedAdminChrome, syncIframeHeightFromDocument])

  const postPayload = useCallback(() => {
    const frame = iframeRef.current?.contentWindow
    if (!frame) return
    frame.postMessage(
      {
        source: 'stitch-host',
        type: 'stitch-data',
        page: file,
        payload,
      },
      window.location.origin,
    )
  }, [file, payload])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      syncEmbeddedAdminChrome()
      postPayload()
      syncIframeHeightFromDocument()
    }, 60)
    return () => window.clearTimeout(timer)
  }, [file, payload, postPayload, syncEmbeddedAdminChrome, syncIframeHeightFromDocument])

  useEffect(() => {
    return () => {
      resizeObserverRef.current?.disconnect()
      mutationObserverRef.current?.disconnect()
      if (pollingTimerRef.current) {
        window.clearInterval(pollingTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const onMessage = (event: MessageEvent<StitchMessage>) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.source !== 'stitch-runtime') return
      if (event.data.page !== file) return

      if (event.data.type === 'ready') {
        postPayload()
        return
      }

      if (event.data.type === 'height' && typeof event.data.height === 'number') {
        setHeight(Math.max(320, Math.ceil(event.data.height) + 2))
        return
      }

      if (event.data.type === 'action' && event.data.action) {
        void onAction?.(event.data.action, event.data.data)
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [file, onAction, postPayload])

  return (
    <div className="stitch-frame-shell">
      <iframe
        ref={iframeRef}
        className="stitch-frame"
        onLoad={() => {
          syncEmbeddedAdminChrome()
          bindIframeHeightObservers()
          syncIframeHeightFromDocument()
          postPayload()
        }}
        src={src}
        style={{ height }}
        title={file}
      />
    </div>
  )
}
