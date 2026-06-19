// POST /api/auth/signup - Create a new account with Supabase Auth + user_profiles.
//
// Request body:
//   { email, password, name, country, role, organization, orgType, sectors[], operatingCountries[], teamSize, consentVersion, analyticsOptIn }
//
// Response:
//   Success: { user: { userId, email, name, ... }, accessToken, refreshToken }
//   Error: { error: "message" }
//
// If Supabase isn't configured (no env vars), returns 503 with a clear message
// telling the user the platform admin needs to configure Supabase.
import { NextRequest, NextResponse } from 'next/server'
import { getPlatformClient, isSupabaseConfigured } from '@/lib/server/platform-auth'

export const maxDuration = 15

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      email, password,
      name, country, role, organization, orgType, sectors, operatingCountries, teamSize,
      consentVersion, analyticsOptIn,
    } = body

    // Validate required fields
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }
    if (!consentVersion) {
      return NextResponse.json({ error: 'Consent is required' }, { status: 400 })
    }

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        error: 'Server auth is not configured. The platform administrator needs to set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.',
      }, { status: 503 })
    }

    const client = await getPlatformClient()
    if (!client) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    // Create the auth user in Supabase Auth
    const { data: authData, error: authError } = await client.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true, // auto-confirm (no email verification for now)
      user_metadata: { name, country, role, organization },
    })

    if (authError) {
      // Handle duplicate email
      if (authError.message.includes('already') || authError.message.includes('exists')) {
        return NextResponse.json({ error: 'An account with this email already exists. Try logging in.' }, { status: 409 })
      }
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const userId = authData.user.id

    // Create the user profile in user_profiles table
    const { error: profileError } = await client.from('user_profiles').insert({
      user_id: userId,
      email: email.toLowerCase().trim(),
      name: name || null,
      country: country || null,
      role: role || null,
      organization: organization || null,
      org_type: orgType || null,
      sectors: sectors || [],
      operating_countries: operatingCountries || [],
      team_size: teamSize || null,
      consent_version: consentVersion,
      analytics_opt_in: analyticsOptIn || false,
      last_seen: new Date().toISOString(),
      usage_count: 1,
    })

    if (profileError) {
      console.error('[signup] profile insert error:', profileError)
      // Don't fail the whole signup - the auth user was created, just the profile failed
    }

    // Generate a session token for the user (so they're logged in immediately)
    const { data: sessionData, error: sessionError } = await client.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    })

    if (sessionError || !sessionData.session) {
      // User was created but we couldn't auto-login. They'll need to log in manually.
      return NextResponse.json({
        user: { userId, email: email.toLowerCase().trim(), name, country, role, organization },
        message: 'Account created. Please log in.',
      })
    }

    return NextResponse.json({
      user: {
        userId,
        email: email.toLowerCase().trim(),
        name,
        country,
        role,
        organization,
        orgType,
        sectors: sectors || [],
        operatingCountries: operatingCountries || [],
        teamSize,
      },
      accessToken: sessionData.session.access_token,
      refreshToken: sessionData.session.refresh_token,
      expiresAt: sessionData.session.expires_at,
    })
  } catch (e: any) {
    console.error('[/api/auth/signup] error:', e)
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 })
  }
}
