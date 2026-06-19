// POST /api/profile - save/update user profile, GET - list (admin) or count (public)
import { NextRequest, NextResponse } from 'next/server'
export const maxDuration = 10

const ADMIN_KEY = process.env.HUBFORGE_ADMIN_KEY || 'hubforge-admin-2024'
const profileStore: Map<string, any> = new Map()

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
    const { profileId, name, email, organization, country, role } = body
    if (!profileId) return NextResponse.json({ error: 'profileId is required' }, { status: 400 })
    const profile = { profile_id: profileId, name: name || null, email: email || null, organization: organization || null, country: country || null, role: role || null, last_seen: new Date().toISOString() }
    const supabase = await getSupabaseClient()
    if (supabase) {
      const { data, error } = await supabase.from('user_profiles').upsert(profile, { onConflict: 'profile_id' }).select()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, profile: data?.[0] })
    }
    const existing = profileStore.get(profileId)
    profileStore.set(profileId, { ...profile, id: profileId, created_at: existing?.created_at || new Date().toISOString(), usage_count: (existing?.usage_count || 0) + 1 })
    return NextResponse.json({ success: true, profile: profileStore.get(profileId) })
  } catch (e: any) { console.error('[/api/profile POST] error:', e); return NextResponse.json({ error: e?.message }, { status: 500 }) }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const adminKey = searchParams.get('admin_key')
    if (adminKey) {
      if (adminKey !== ADMIN_KEY) return NextResponse.json({ error: 'Invalid admin key' }, { status: 403 })
      const supabase = await getSupabaseClient()
      if (supabase) {
        const { data, error } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false }).limit(500)
        if (error) throw error
        const { data: sessions } = await supabase.from('reasoning_sessions').select('session_id, problem, final_score, created_at')
        return NextResponse.json({ users: data || [], totalSessions: sessions?.length || 0, sessions: sessions || [] })
      }
      return NextResponse.json({ users: Array.from(profileStore.values()), totalSessions: 0, sessions: [] })
    }
    const supabase = await getSupabaseClient()
    if (supabase) { const { count } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true }); return NextResponse.json({ userCount: count || 0 }) }
    return NextResponse.json({ userCount: profileStore.size })
  } catch (e: any) { console.error('[/api/profile GET] error:', e); return NextResponse.json({ error: e?.message }, { status: 500 }) }
}
