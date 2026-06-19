// GET /api/rate-limit - check the current user's daily strategy allowance.
// POST /api/rate-limit - record a successful strategy generation (increment counter).
//
// Query/body params:
//   - profileId: the user's profile ID (from localStorage, see user-profile.ts)
//   - provider: the AI provider ('zai' | 'zai-key' | 'openai' | ...)
//
// Returns:
//   { allowed, used, limit, remaining, resetsAt, isOwnKey }
//
// Own-key users always get allowed=true, remaining=Infinity.
// Shared-key users get 5 generations/day per profileId.
import { NextRequest, NextResponse } from 'next/server'
export const maxDuration = 10

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const profileId = searchParams.get('profileId')
    const provider = searchParams.get('provider') || 'zai'
    const { checkRateLimit } = await import('@/lib/server/rate-limit-server')
    const result = checkRateLimit(profileId, provider)
    return NextResponse.json(result)
  } catch (e: any) {
    console.error('[/api/rate-limit GET] error:', e)
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { profileId, provider } = body as { profileId?: string; provider?: string }
    const { recordStrategyGeneration } = await import('@/lib/server/rate-limit-server')
    recordStrategyGeneration(profileId, provider || 'zai')
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[/api/rate-limit POST] error:', e)
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
