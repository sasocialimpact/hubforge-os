// POST /api/analytics - track event, GET - dashboard data (admin)
//
// Data ownership priority:
//   1. User's own Supabase (X-Org-Supabase-* headers) → events go to THEIR DB
//   2. Platform Supabase (env vars) - for platform-level analytics (opt-in)
//   3. In-memory store
//
// ADMIN KEY:
//   The admin dashboard is gated by HUBFORGE_ADMIN_KEY. If the env var is
//   not set, admin endpoints return 403 (no insecure default).
import { NextRequest, NextResponse } from 'next/server'
export const maxDuration = 10

function requireAdminKey(provided: string | null): boolean {
  const expected = process.env.HUBFORGE_ADMIN_KEY
  if (!expected) return false // admin disabled until env var is configured
  if (!provided) return false
  if (provided.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < provided.length; i++) diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i)
  return diff === 0
}

const eventStore: any[] = []

let platformClient: any = null
let platformInitialized = false
async function getPlatformClient() {
  if (platformInitialized) return platformClient
  platformInitialized = true
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) return null
  try {
    const { createClient } = await import('@supabase/supabase-js')
    platformClient = createClient(url, key)
    return platformClient
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { profileId, sessionId, eventType, eventCategory, eventData, page, durationMs } = body
    if (!eventType || typeof eventType !== 'string') return NextResponse.json({ error: 'eventType is required' }, { status: 400 })
    if (eventType.length > 100) return NextResponse.json({ error: 'eventType too long' }, { status: 400 })
    if (!/^[a-z_]+$/i.test(eventType)) return NextResponse.json({ error: 'invalid eventType format' }, { status: 400 })

    const event = {
      profile_id: typeof profileId === 'string' ? profileId.slice(0, 100) : null,
      session_id: typeof sessionId === 'string' ? sessionId.slice(0, 100) : null,
      event_type: eventType.slice(0, 100),
      event_category: typeof eventCategory === 'string' ? eventCategory.slice(0, 50) : 'engagement',
      event_data: eventData && typeof eventData === 'object' ? eventData : {},
      page: typeof page === 'string' ? page.slice(0, 200) : '/',
      duration_ms: typeof durationMs === 'number' ? durationMs : null,
      user_agent: req.headers.get('user-agent')?.slice(0, 500) || null,
      referrer: req.headers.get('referer')?.slice(0, 500) || null,
    }

    // 1. Org Supabase (user's own analytics DB)
    const { maybeGetOrgSupabaseClient } = await import('@/lib/server/org-supabase')
    const orgClient = await maybeGetOrgSupabaseClient(req)
    if (orgClient) {
      const { error } = await orgClient.from('analytics_events').insert(event)
      if (error) console.error('[analytics] org-supabase error:', error)
      else return NextResponse.json({ success: true, source: 'org-supabase' })
      // Fall through on error to platform/in-memory.
    }

    // 2. Platform Supabase
    const supabase = await getPlatformClient()
    if (supabase) {
      const { error } = await supabase.from('analytics_events').insert(event)
      if (error) console.error('[analytics] platform-supabase error:', error)
      else return NextResponse.json({ success: true, source: 'platform-supabase' })
    }

    // 3. In-memory
    eventStore.push({ ...event, id: `e-${eventStore.length}`, created_at: new Date().toISOString() })
    if (eventStore.length > 5000) eventStore.shift()
    return NextResponse.json({ success: true, source: 'memory' })
  } catch (e: any) {
    console.error('[/api/analytics POST] error:', e)
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const adminKey = searchParams.get('admin_key')
    const days = parseInt(searchParams.get('days') || '30')
    if (!requireAdminKey(adminKey)) {
      return NextResponse.json({ error: 'Invalid or missing admin key' }, { status: 403 })
    }

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    // Admin dashboard only reads platform-level data (not per-user org DBs).
    const supabase = await getPlatformClient()
    if (supabase) {
      const { data: events, error } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(10000)
      if (error) throw error
      return NextResponse.json(buildDashboard(events || []))
    }
    return NextResponse.json(buildDashboard(eventStore.filter((e) => e.created_at >= since)))
  } catch (e: any) {
    console.error('[/api/analytics GET] error:', e)
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

function buildDashboard(events: any[]) {
  const now = Date.now()
  const dayMs = 86400000
  const dailyActive: any[] = []
  for (let i = 29; i >= 0; i--) {
    const dayKey = new Date(now - i * dayMs).toISOString().slice(0, 10)
    const dayEvents = events.filter((e) => e.created_at?.slice(0, 10) === dayKey)
    dailyActive.push({ date: dayKey, users: new Set(dayEvents.map((e) => e.profile_id).filter(Boolean)).size, events: dayEvents.length })
  }
  const eventTypeCounts: Record<string, number> = {}
  for (const e of events) eventTypeCounts[e.event_type] = (eventTypeCounts[e.event_type] || 0) + 1
  const funnel = {
    app_open: eventTypeCounts['app_open'] || 0,
    onboarding_start: eventTypeCounts['onboarding_start'] || 0,
    onboarding_complete: eventTypeCounts['onboarding_complete'] || 0,
    run_start: eventTypeCounts['run_start'] || 0,
    run_complete: eventTypeCounts['run_complete'] || 0,
    output_viewed: eventTypeCounts['output_viewed'] || 0,
    feedback_given: eventTypeCounts['feedback_given'] || 0,
    install_prompt: eventTypeCounts['install_prompt_shown'] || 0,
    install_accepted: eventTypeCounts['install_accepted'] || 0,
  }
  const outputTypeUsage: Record<string, number> = {}
  for (const e of events) {
    if (e.event_type === 'run_start' && e.event_data?.outputTypes) {
      for (const ot of e.event_data.outputTypes) outputTypeUsage[ot] = (outputTypeUsage[ot] || 0) + 1
    }
  }
  const providerUsage: Record<string, number> = {}
  for (const e of events) {
    if (e.event_data?.provider) providerUsage[e.event_data.provider] = (providerUsage[e.event_data.provider] || 0) + 1
  }
  const scores: number[] = []
  for (const e of events) {
    if (e.event_type === 'run_complete' && e.event_data?.finalScore != null) scores.push(e.event_data.finalScore)
  }
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  const scoreBuckets = { below60: 0, '60-79': 0, '80-89': 0, '90+': 0 }
  for (const s of scores) {
    if (s < 60) scoreBuckets.below60++
    else if (s < 80) scoreBuckets['60-79']++
    else if (s < 90) scoreBuckets['80-89']++
    else scoreBuckets['90+']++
  }
  const durations: number[] = []
  for (const e of events) {
    if (e.event_type === 'run_complete' && e.duration_ms) durations.push(e.duration_ms)
  }
  const avgDuration = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 1000) : 0
  const errors = events.filter((e) => e.event_category === 'error')
  return {
    summary: {
      totalEvents: events.length,
      uniqueUsers: new Set(events.map((e) => e.profile_id).filter(Boolean)).size,
      returningUsers: 0,
      avgScore,
      avgDurationSec: avgDuration,
      totalErrors: errors.length,
      installRate: funnel.install_prompt > 0 ? Math.round((funnel.install_accepted / funnel.install_prompt) * 100) : 0,
    },
    dailyActive,
    eventTypeCounts: Object.entries(eventTypeCounts).sort((a, b) => b[1] - a[1]),
    funnel,
    outputTypeUsage: Object.entries(outputTypeUsage).sort((a, b) => b[1] - a[1]),
    providerUsage: Object.entries(providerUsage).sort((a, b) => b[1] - a[1]),
    scoreBuckets,
    recentErrors: errors.slice(0, 20).map((e) => ({
      type: e.event_type,
      message: e.event_data?.error || e.event_data?.message,
      time: e.created_at,
      profile: e.profile_id,
    })),
  }
}
