// POST /api/organizations - Create an organization
// GET  /api/organizations - List user's organizations
import { NextRequest, NextResponse } from 'next/server'
import { createOrganization, getUserOrgs } from '@/lib/server/organizations'

export const maxDuration = 10

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, slug, userId } = body
    if (!name || !slug || !userId) {
      return NextResponse.json({ error: 'name, slug, and userId are required' }, { status: 400 })
    }

    const org = await createOrganization(name, slug, userId)
    if (!org) {
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
    }

    return NextResponse.json({ org }, { status: 201 })
  } catch (e: any) {
    console.error('[/api/organizations POST] error:', e)
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId query param required' }, { status: 400 })
    }

    const orgs = await getUserOrgs(userId)
    return NextResponse.json({ orgs })
  } catch (e: any) {
    console.error('[/api/organizations GET] error:', e)
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 })
  }
}
