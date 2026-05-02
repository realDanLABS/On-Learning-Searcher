import { createClient } from 'npm:@supabase/supabase-js@2'

type ImportPayload = {
  rows?: Record<string, unknown>[]
  replace?: boolean
  fileName?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = Deno.env.get('SUPABASE_URL') || ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const authHeader = request.headers.get('Authorization') || ''
    const accessToken = authHeader.replace(/^Bearer\s+/i, '').trim()

    if (!url || !anonKey || !serviceRoleKey) {
      return Response.json({ error: 'missing-supabase-config' }, { status: 500, headers: corsHeaders })
    }
    if (!accessToken) {
      return Response.json({ error: 'missing-access-token' }, { status: 401, headers: corsHeaders })
    }

    const authClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const adminClient = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const userResult = await authClient.auth.getUser(accessToken)
    if (userResult.error || !userResult.data.user) {
      return Response.json({ error: userResult.error?.message || 'invalid-access-token' }, { status: 401, headers: corsHeaders })
    }

    const body = (await request.json()) as ImportPayload
    const rows = Array.isArray(body.rows) ? body.rows : []
    if (!rows.length) {
      return Response.json({ error: '업로드할 과정 데이터가 없습니다.' }, { status: 400, headers: corsHeaders })
    }

    const rpcResult = await adminClient.rpc('admin_course_bulk_import', {
      p_auth_user_id: userResult.data.user.id,
      p_rows: rows,
      p_replace: Boolean(body.replace),
      p_file_name: String(body.fileName || '').trim() || 'course_list_upload.xlsx',
    })

    if (rpcResult.error) {
      return Response.json({ error: rpcResult.error.message || 'course-import-failed' }, { status: 500, headers: corsHeaders })
    }

    return Response.json(rpcResult.data, { headers: corsHeaders })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'unexpected-admin-course-import-error' },
      { status: 500, headers: corsHeaders },
    )
  }
})
