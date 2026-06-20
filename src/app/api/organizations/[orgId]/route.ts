// GET /api/organizations/[orgId] - Get org details + members
import { NextRequest, NextResponse } from 'next/server'
import { getOrganization, getOrgMembers, isOrgMember } from '@/lib/server/organizations'

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

    const [org, members] = await Promise.all([
      getOrganization(orgId),
      getOrgMembers(orgId),
    ])

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    return NextResponse.json({ org, members })
  } catch (e: any) {
    console.error('[/api/organizations/[orgId] GET] error:', e)
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 })
  }
}
