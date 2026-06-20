// POST   /api/organizations/[orgId]/members - Invite a member
// DELETE /api/organizations/[orgId]/members - Remove a member
import { NextRequest, NextResponse } from 'next/server'
import { inviteMember, removeMember, isOrgAdmin } from '@/lib/server/organizations'

export const maxDuration = 10

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await params
    const body = await req.json()
    const { userId, role, invitedBy } = body

    if (!userId || !role || !invitedBy) {
      return NextResponse.json({ error: 'userId, role, and invitedBy are required' }, { status: 400 })
    }

    const admin = await isOrgAdmin(orgId, invitedBy)
    if (!admin) {
      return NextResponse.json({ error: 'Only admins/owners can invite members' }, { status: 403 })
    }

    const member = await inviteMember(orgId, userId, role, invitedBy)
    if (!member) {
      return NextResponse.json({ error: 'Failed to invite member' }, { status: 500 })
    }

    return NextResponse.json({ member }, { status: 201 })
  } catch (e: any) {
    console.error('[/api/organizations/[orgId]/members POST] error:', e)
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await params
    const { userId, requestedBy } = await req.json()

    if (!userId || !requestedBy) {
      return NextResponse.json({ error: 'userId and requestedBy are required' }, { status: 400 })
    }

    const admin = await isOrgAdmin(orgId, requestedBy)
    if (!admin) {
      return NextResponse.json({ error: 'Only admins/owners can remove members' }, { status: 403 })
    }

    const ok = await removeMember(orgId, userId)
    if (!ok) {
      return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[/api/organizations/[orgId]/members DELETE] error:', e)
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 })
  }
}
