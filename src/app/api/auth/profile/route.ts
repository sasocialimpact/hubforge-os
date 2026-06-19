// POST /api/auth/profile - Update the user's profile (name, country, role, org, etc.)
import { NextRequest, NextResponse } from 'next/server'
import { getPlatformClient, isSupabaseConfigured } from '@/lib/server/platform-auth'

export const maxDuration = 10

export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Auth not configured' }, { status: 503 })
    }

    const client = await getPlatformClient()
    if (!client) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const auth = req.headers.get('authorization')
    const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'No token' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await client.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await req.json()
    const { name, country, role, organization, orgType, sectors, operatingCountries, teamSize } = body

    const updates: any = { last_seen: new Date().toISOString() }
    if (name !== undefined) updates.name = name
    if (country !== undefined) updates.country = country
    if (role !== undefined) updates.role = role
    if (organization !== undefined) updates.organization = organization
    if (orgType !== undefined) updates.org_type = orgType
    if (sectors !== undefined) updates.sectors = sectors
    if (operatingCountries !== undefined) updates.operating_countries = operatingCountries
    if (teamSize !== undefined) updates.team_size = teamSize

    const { error: updateError } = await client.from('user_profiles')
      .update(updates)
      .eq('user_id', user.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[/api/auth/profile] error:', e)
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 })
  }
}
