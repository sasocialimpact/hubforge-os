// POST /api/auth/logout - Log out (invalidate the session token).
// The client just discards its tokens; this endpoint optionally revokes
// the session server-side if Supabase is configured.
import { NextRequest, NextResponse } from 'next/server'
import { getPlatformClient, isSupabaseConfigured } from '@/lib/server/platform-auth'

export const maxDuration = 10

export async function POST(req: NextRequest) {
  try {
    // If Supabase is configured, revoke the session server-side.
    if (isSupabaseConfigured()) {
      const client = await getPlatformClient()
      if (client) {
        const auth = req.headers.get('authorization')
        const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null
        if (token) {
          try { await client.auth.signOut({ scope: 'global' }) } catch {}
        }
      }
    }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    // Logout should never fail on the client side
    return NextResponse.json({ success: true })
  }
}
