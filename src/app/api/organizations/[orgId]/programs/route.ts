// GET /api/organizations/[orgId]/programs - List org programs from Supabase
import { NextRequest, NextResponse } from 'next/server'
import { isOrgMember } from '@/lib/server/organizations'
import { getPlatformClient } from '@/lib/server/platform-auth'

export const maxDuration = 10

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await params
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId query param required' }, { status: 400 })
    }

    const member = await isOrgMember(orgId, userId)
    if (!member) {
      return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 })
    }

    const client = await getPlatformClient()
    if (!client) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    // Query reasoning_sessions that belong to this org
    const { data: sessions, error } = await client
      .from('reasoning_sessions')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[/api/organizations/[orgId]/programs GET] error:', error)
      return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 })
    }

    return NextResponse.json({ programs: sessions || [] })
  } catch (e: any) {
    console.error('[/api/organizations/[orgId]/programs GET] error:', e)
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 })
  }
}
