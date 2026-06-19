// GET /api/memory - list sessions, DELETE - clear, POST - save
import { NextRequest, NextResponse } from 'next/server'

interface MemoryRecord { id: string; timestamp: string; problem: string; iterations: number; finalScore: number; thresholdMet: boolean; finalDraft: string; structuredOutputs?: any; provider?: string }
const memoryStore: MemoryRecord[] = []

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

export async function GET() {
  try {
    const supabase = await getSupabaseClient()
    if (supabase) {
      const { data, error } = await supabase.from('reasoning_sessions').select('id, created_at, problem, iterations, final_score, threshold_met, structured_outputs, provider').order('created_at', { ascending: false }).limit(50)
      if (error) throw error
      return NextResponse.json({ memory: data || [] })
    }
    return NextResponse.json({ memory: [...memoryStore].reverse() })
  } catch (e: any) { console.error('[/api/memory GET] error:', e); return NextResponse.json({ memory: [], error: e?.message }, { status: 200 }) }
}

export async function DELETE() {
  try {
    const supabase = await getSupabaseClient()
    if (supabase) { await supabase.from('reasoning_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000'); return NextResponse.json({ memory: [] }) }
    memoryStore.length = 0
    return NextResponse.json({ memory: [] })
  } catch (e: any) { console.error('[/api/memory DELETE] error:', e); return NextResponse.json({ memory: [], error: e?.message }, { status: 200 }) }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { record } = body as { record: MemoryRecord }
    const supabase = await getSupabaseClient()
    if (supabase) {
      const { error } = await supabase.from('reasoning_sessions').insert({ session_id: record.id, problem: record.problem, iterations: record.iterations, final_score: record.finalScore, threshold_met: record.thresholdMet, final_draft: record.finalDraft, structured_outputs: record.structuredOutputs, provider: record.provider })
      if (error) throw error
      return NextResponse.json({ success: true })
    }
    memoryStore.push(record)
    if (memoryStore.length > 50) memoryStore.shift()
    return NextResponse.json({ success: true })
  } catch (e: any) { console.error('[/api/memory POST] error:', e); return NextResponse.json({ success: false, error: e?.message }, { status: 500 }) }
}
