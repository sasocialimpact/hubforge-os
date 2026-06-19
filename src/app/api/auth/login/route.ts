// POST /api/auth/login - Log in with email + password.
//
// Response:
//   Success: { user: { userId, email, name, country, role, organization, ... }, accessToken, refreshToken }
//   Error: { error: "message" }
import { NextRequest, NextResponse } from 'next/server'
import { getPlatformClient, isSupabaseConfigured, getProfileByUserId } from '@/lib/server/platform-auth'

export const maxDuration = 15

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        error: 'Server auth is not configured. The platform administrator needs to set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.',
      }, { status: 503 })
    }

    const client = await getPlatformClient()
    if (!client) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    })

    if (authError || !authData.user || !authData.session) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Fetch the user's profile from user_profiles
    const profile = await getProfileByUserId(client, authData.user.id)

    // Update last_seen + usage_count
    await client.from('user_profiles')
      .update({ last_seen: new Date().toISOString() })
      .eq('user_id', authData.user.id)

    return NextResponse.json({
      user: profile || {
        userId: authData.user.id,
        email: authData.user.email || '',
      },
      accessToken: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
      expiresAt: authData.session.expires_at,
    })
  } catch (e: any) {
    console.error('[/api/auth/login] error:', e)
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 })
  }
}
