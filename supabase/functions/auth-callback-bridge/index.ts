import { createClient } from 'npm:@supabase/supabase-js@2'

type CallbackPayload = {
  employeeId?: string
  name?: string
  organization?: string
  companyEmail?: string
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
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    if (!url || !serviceRoleKey) {
      return Response.json({ error: 'missing-supabase-service-role-config' }, { status: 500, headers: corsHeaders })
    }

    const admin = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const body = (await request.json()) as CallbackPayload
    const employeeId = String(body.employeeId || '').trim()
    const name = String(body.name || '').trim()
    const organization = String(body.organization || '').trim()
    const companyEmail = String(body.companyEmail || '').trim().toLowerCase() || `${employeeId}@company.local`

    if (!employeeId || !name || !organization) {
      return Response.json({ error: 'missing-required-callback-fields' }, { status: 400, headers: corsHeaders })
    }

    const upsertResult = await admin.rpc('upsert_sso_user', {
      p_employee_id: employeeId,
      p_name: name,
      p_organization: organization,
      p_company_email: companyEmail,
    })
    if (upsertResult.error || !upsertResult.data?.[0]) {
      return Response.json({ error: upsertResult.error?.message || 'failed-to-upsert-app-user' }, { status: 500, headers: corsHeaders })
    }

    const appUser = upsertResult.data[0]
    let authUserId: string | null = null
    const authEmail = String(appUser.company_email || companyEmail).trim().toLowerCase()

    const listedUsers = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    })
    const matched = listedUsers.data.users.find((user) => (user.email || '').toLowerCase() === authEmail)
    if (matched) {
      authUserId = matched.id
    } else {
      const created = await admin.auth.admin.createUser({
        email: authEmail,
        email_confirm: true,
        user_metadata: {
          employee_id: employeeId,
          name,
          organization,
        },
      })
      if (created.error || !created.data.user) {
        return Response.json({ error: created.error?.message || 'failed-to-create-auth-user' }, { status: 500, headers: corsHeaders })
      }
      authUserId = created.data.user.id
    }

    const linkResult = await admin.rpc('link_auth_user_for_employee', {
      p_employee_id: employeeId,
      p_auth_user_id: authUserId,
    })
    if (linkResult.error) {
      return Response.json({ error: linkResult.error.message }, { status: 500, headers: corsHeaders })
    }

    const generated = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: authEmail,
      options: {
        redirectTo: `${new URL(url).origin}/auth/callback`,
      },
    })

    if (generated.error || !generated.data.properties?.hashed_token) {
      return Response.json({ error: generated.error?.message || 'failed-to-generate-auth-link' }, { status: 500, headers: corsHeaders })
    }

    return Response.json(
      {
        email: authEmail,
        tokenHash: generated.data.properties.hashed_token,
        type: 'email',
      },
      {
        headers: corsHeaders,
      },
    )
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'unexpected-auth-callback-bridge-error',
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    )
  }
})
