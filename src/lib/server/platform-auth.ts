// Shared auth helpers for API routes.
// Uses @supabase/supabase-js to manage server-side auth + user_profiles.
import type { NextRequest } from 'next/server'

let platformClient: any = null
let platformInitialized = false

export async function getPlatformClient() {
  if (platformInitialized) return platformClient
  platformInitialized = true
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) return null
  try {
    const { createClient } = await import('@supabase/supabase-js')
    platformClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    return platformClient
  } catch {
    return null
  }
}

export function isSupabaseConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)
}

// Extract the session token from the request (sent by the client as a Bearer header).
export function getAuthToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization')
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7)
  return null
}

export interface PlatformUser {
  userId: string
  email: string
  name?: string
  country?: string
  role?: string
  organization?: string
  orgType?: string
  sectors?: string[]
  operatingCountries?: string[]
  teamSize?: string
  consentVersion?: string
  analyticsOptIn?: boolean
}

// Fetch the user profile from Supabase by user_id.
export async function getProfileByUserId(client: any, userId: string): Promise<PlatformUser | null> {
  const { data, error } = await client
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) return null
  return {
    userId: data.user_id,
    email: data.email,
    name: data.name,
    country: data.country,
    role: data.role,
    organization: data.organization,
    orgType: data.org_type,
    sectors: data.sectors || [],
    operatingCountries: data.operating_countries || [],
    teamSize: data.team_size,
    consentVersion: data.consent_version,
    analyticsOptIn: data.analytics_opt_in,
  }
}
