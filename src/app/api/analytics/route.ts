// POST /api/analytics - track event, GET - dashboard data (admin)
import { NextRequest, NextResponse } from 'next/server'

const ADMIN_KEY = process.env.HUBFORGE_ADMIN_KEY || 'hubforge-admin-2024'
const eventStore: any[] = []

let supabaseClient: any = null
let supabaseInitialized = false
async function getSupabaseClient() {
  if (supabaseInitialized) return supabaseClient
  supabaseInitialized = true
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) return null
  try { const { createClient } = await import('@supabase/supabase-js'); supabaseClient = createClient(url, key); return supabaseClient } catch { return null }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { profileId, sessionId, eventType, eventCategory, eventData, page, durationMs } = body
    if (!eventType) return NextResponse.json({ error: 'eventType is required' }, { status: 400 })
    const event = { profile_id: profileId || null, session_id: sessionId || null, event_type: eventType, event_category: eventCategory || 'engagement', event_data: eventData || {}, page: page || '/', duration_ms: durationMs || null, user_agent: req.headers.get('user-agent') || null, referrer: req.headers.get('referer') || null }
    const supabase = await getSupabaseClient()
    if (supabase) { const { error } = await supabase.from('analytics_events').insert(event); if (error) console.error('[analytics] supabase error:', error); else return NextResponse.json({ success: true }) }
    eventStore.push({ ...event, id: `e-${eventStore.length}`, created_at: new Date().toISOString() })
    if (eventStore.length > 5000) eventStore.shift()
    return NextResponse.json({ success: true })
  } catch (e: any) { console.error('[/api/analytics POST] error:', e); return NextResponse.json({ error: e?.message }, { status: 500 }) }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const adminKey = searchParams.get('admin_key')
    const days = parseInt(searchParams.get('days') || '30')
    if (!adminKey || adminKey !== ADMIN_KEY) return NextResponse.json({ error: 'Invalid admin key' }, { status: 403 })
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const supabase = await getSupabaseClient()
    if (supabase) {
      const { data: events, error } = await supabase.from('analytics_events').select('*').gte('created_at', since).order('created_at', { ascending: false }).limit(10000)
      if (error) throw error
      return NextResponse.json(buildDashboard(events || []))
    }
    return NextResponse.json(buildDashboard(eventStore.filter((e) => e.created_at >= since)))
  } catch (e: any) { console.error('[/api/analytics GET] error:', e); return NextResponse.json({ error: e?.message }, { status: 500 }) }
}

function buildDashboard(events: any[]) {
  const now = Date.now()
  const dayMs = 86400000
  const dailyActive: any[] = []
  for (let i = 29; i >= 0; i--) { const dayKey = new Date(now - i * dayMs).toISOString().slice(0, 10); const dayEvents = events.filter((e) => e.created_at?.slice(0, 10) === dayKey); dailyActive.push({ date: dayKey, users: new Set(dayEvents.map((e) => e.profile_id).filter(Boolean)).size, events: dayEvents.length }) }
  const eventTypeCounts: Record<string, number> = {}; for (const e of events) eventTypeCounts[e.event_type] = (eventTypeCounts[e.event_type] || 0) + 1
  const funnel = { app_open: eventTypeCounts['app_open'] || 0, onboarding_start: eventTypeCounts['onboarding_start'] || 0, onboarding_complete: eventTypeCounts['onboarding_complete'] || 0, run_start: eventTypeCounts['run_start'] || 0, run_complete: eventTypeCounts['run_complete'] || 0, output_viewed: eventTypeCounts['output_viewed'] || 0, feedback_given: eventTypeCounts['feedback_given'] || 0, install_prompt: eventTypeCounts['install_prompt_shown'] || 0, install_accepted: eventTypeCounts['install_accepted'] || 0 }
  const outputTypeUsage: Record<string, number> = {}; for (const e of events) { if (e.event_type === 'run_start' && e.event_data?.outputTypes) for (const ot of e.event_data.outputTypes) outputTypeUsage[ot] = (outputTypeUsage[ot] || 0) + 1 }
  const providerUsage: Record<string, number> = {}; for (const e of events) { if (e.event_data?.provider) providerUsage[e.event_data.provider] = (providerUsage[e.event_data.provider] || 0) + 1 }
  const scores: number[] = []; for (const e of events) { if (e.event_type === 'run_complete' && e.event_data?.finalScore != null) scores.push(e.event_data.finalScore) }
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  const scoreBuckets = { below60: 0, '60-79': 0, '80-89': 0, '90+': 0 }; for (const s of scores) { if (s < 60) scoreBuckets.below60++; else if (s < 80) scoreBuckets['60-79']++; else if (s < 90) scoreBuckets['80-89']++; else scoreBuckets['90+']++ }
  const durations: number[] = []; for (const e of events) { if (e.event_type === 'run_complete' && e.duration_ms) durations.push(e.duration_ms) }
  const avgDuration = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 1000) : 0
  const errors = events.filter((e) => e.event_category === 'error')
  return { summary: { totalEvents: events.length, uniqueUsers: new Set(events.map((e) => e.profile_id).filter(Boolean)).size, returningUsers: 0, avgScore, avgDurationSec: avgDuration, totalErrors: errors.length, installRate: funnel.install_prompt > 0 ? Math.round((funnel.install_accepted / funnel.install_prompt) * 100) : 0 }, dailyActive, eventTypeCounts: Object.entries(eventTypeCounts).sort((a, b) => b[1] - a[1]), funnel, outputTypeUsage: Object.entries(outputTypeUsage).sort((a, b) => b[1] - a[1]), providerUsage: Object.entries(providerUsage).sort((a, b) => b[1] - a[1]), scoreBuckets, recentErrors: errors.slice(0, 20).map((e) => ({ type: e.event_type, message: e.event_data?.error || e.event_data?.message, time: e.created_at, profile: e.profile_id })) }
}
