import type { NextRequest } from 'next/server'

// Legacy shared API handler is plain JS and intentionally bridged here.
// @ts-expect-error no local type declarations for this legacy module
import apiHandler from '../../../api/handler.js'

type HeaderValue = string | string[]

class ResponseAdapter {
  statusCode = 200
  headers = new Headers()
  payload: unknown = null

  setHeader(name: string, value: HeaderValue) {
    if (Array.isArray(value)) {
      this.headers.delete(name)
      for (const item of value) {
        this.headers.append(name, item)
      }
      return this
    }
    this.headers.set(name, value)
    return this
  }

  status(code: number) {
    this.statusCode = code
    return this
  }

  json(payload: unknown) {
    this.payload = payload
    if (!this.headers.has('Content-Type')) {
      this.headers.set('Content-Type', 'application/json; charset=utf-8')
    }
    return this
  }
}

async function handle(request: NextRequest, routeParams?: string[]) {
  const url = new URL(request.url)
  const body = request.method === 'GET' || request.method === 'HEAD' ? {} : await readBody(request)
  const req = {
    method: request.method,
    url: `/api/${(routeParams || []).join('/')}?${url.searchParams.toString()}`,
    headers: {
      cookie: request.headers.get('cookie') || '',
      'content-type': request.headers.get('content-type') || 'application/json',
      origin: request.headers.get('origin') || '',
    },
    body,
    query: Object.fromEntries(url.searchParams.entries()),
  }

  const res = new ResponseAdapter()
  await apiHandler(req as never, res as never)

  return Response.json(res.payload, {
    status: res.statusCode,
    headers: res.headers,
  })
}

async function readBody(request: NextRequest) {
  const contentType = request.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    try {
      return await request.json()
    } catch {
      return {}
    }
  }
  return await request.text()
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ route?: string[] }> },
) {
  const params = await context.params
  return handle(request, params.route)
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ route?: string[] }> },
) {
  const params = await context.params
  return handle(request, params.route)
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ route?: string[] }> },
) {
  const params = await context.params
  return handle(request, params.route)
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ route?: string[] }> },
) {
  const params = await context.params
  return handle(request, params.route)
}

export async function OPTIONS(
  request: NextRequest,
  context: { params: Promise<{ route?: string[] }> },
) {
  const params = await context.params
  return handle(request, params.route)
}
