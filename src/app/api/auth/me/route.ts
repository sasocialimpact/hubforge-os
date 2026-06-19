// GET /api/auth/me - Get the current user's profile using their access token.
import { NextRequest, NextResponse } from 'next/server'
import { getPlatformClient, isSupabaseConfigured, getProfileByUserId } from '@/lib/server/platform-auth'

export const maxDuration = 10

export async function GET(req: NextRequest) {
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

    // Verify the token + get the user
    const { data: { user }, error } = await client.auth.getUser(token)
    if (error || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // Fetch the profile
    const profile = await getProfileByUserId(client, user.id)

    return NextResponse.json({
      user: profile || { userId: user.id, email: user.email || '' },
    })
  } catch (e: any) {
    console.error('[/api/auth/me] error:', e)
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 })
  }
}
