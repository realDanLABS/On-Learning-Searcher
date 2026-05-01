#!/usr/bin/env node
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import apiHandler from '../api/[...route].js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const distDir = path.join(projectRoot, 'dist')
const publicDir = path.join(projectRoot, 'public')

const PORT = Number(process.env.PORT || 8787)

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

const apiRoots = [
  '/health',
  '/auth',
  '/profile',
  '/diagnosis',
  '/recommendations',
  '/selected-course',
  '/enrollments',
  '/journey',
  '/chatbot',
  '/admin',
]

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || `127.0.0.1:${PORT}`}`)
    const pathname = url.pathname

    if (req.method === 'OPTIONS' && isApiRequest(pathname)) {
      setCors(res, req.headers.origin)
      res.writeHead(204)
      res.end()
      return
    }

    if (isApiRequest(pathname)) {
      setCors(res, req.headers.origin)
      await attachParsedRequestBody(req)
      attachQuery(req, url)
      await apiHandler(req, createNodeResponseAdapter(res))
      return
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify({ error: { code: 'METHOD_NOT_ALLOWED', message: '허용되지 않은 메서드입니다.' } }))
      return
    }

    const served = await serveStaticAsset(pathname, res)
    if (served) return

    const indexPath = path.join(distDir, 'index.html')
    if (fs.existsSync(indexPath)) {
      await streamFile(indexPath, res, 'text/html; charset=utf-8')
      return
    }

    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'dist/index.html을 찾을 수 없습니다. 먼저 빌드해 주세요.' } }))
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(
      JSON.stringify({
        error: {
          code: 'SERVER',
          message: error instanceof Error ? error.message : '서버 오류가 발생했습니다.',
        },
      }),
    )
  }
})

server.listen(PORT, () => {
  console.log(`[app-server] listening on http://127.0.0.1:${PORT}`)
  console.log('[app-server] backend: shared /api handler + Supabase/Postgres')
})

function isApiRequest(pathname) {
  if (pathname === '/api' || pathname.startsWith('/api/')) return true
  return apiRoots.some((root) => pathname === root || pathname.startsWith(`${root}/`))
}

function setCors(res, origin) {
  if (origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
}

function attachQuery(req, url) {
  req.query = Object.fromEntries(url.searchParams.entries())
}

async function attachParsedRequestBody(req) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    req.body = {}
    return
  }

  let raw = ''
  for await (const chunk of req) {
    raw += chunk
    if (raw.length > 1_000_000) {
      throw new Error('Payload too large')
    }
  }

  if (!raw.trim()) {
    req.body = {}
    return
  }

  const contentType = String(req.headers['content-type'] || '')
  if (contentType.includes('application/json')) {
    req.body = JSON.parse(raw)
    return
  }

  req.body = raw
}

function createNodeResponseAdapter(res) {
  return {
    setHeader(name, value) {
      res.setHeader(name, value)
      return this
    },
    status(code) {
      res.statusCode = code
      return this
    },
    json(payload) {
      if (!res.hasHeader('Content-Type')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
      }
      res.end(JSON.stringify(payload))
      return this
    },
  }
}

async function serveStaticAsset(pathname, res) {
  const candidates = [
    path.join(distDir, sanitizePathname(pathname)),
    path.join(publicDir, sanitizePathname(pathname)),
  ]

  for (const filePath of candidates) {
    if (!isInsideAllowedRoot(filePath, distDir) && !isInsideAllowedRoot(filePath, publicDir)) continue
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) continue
    await streamFile(filePath, res, getMimeType(filePath))
    return true
  }

  return false
}

function sanitizePathname(pathname) {
  return decodeURIComponent(pathname).replace(/^\/+/, '')
}

function isInsideAllowedRoot(filePath, root) {
  const relative = path.relative(root, filePath)
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative)
}

function getMimeType(filePath) {
  return mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream'
}

async function streamFile(filePath, res, contentType) {
  res.writeHead(200, { 'Content-Type': contentType })
  await new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath)
    stream.on('error', reject)
    stream.on('end', resolve)
    stream.pipe(res)
  })
}
