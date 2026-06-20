// GET /api/memory - list sessions, DELETE - clear, POST - save
//
// Data ownership priority:
//   1. User's own Supabase (X-Org-Supabase-Url / X-Org-Supabase-Key headers)
//      → writes/reads go to THEIR database. HubForge platform never sees the data.
//   2. Platform Supabase (SUPABASE_URL / SUPABASE_SERVICE_KEY env vars)
//      → fallback so the app still works for users who haven't connected their own DB.
//   3. In-memory store (per server instance)
//      → last-resort fallback so the app always works even with zero Supabase config.
import { NextRequest, NextResponse } from 'next/server'
import { getPlatformClient } from '@/lib/server/platform-supabase'
import { pushMemory, clearMemory, listMemory, type MemoryRecord } from '@/lib/server/memory-store'
export const maxDuration = 10

export async function GET(req: NextRequest) {
  try {
    // 1. Org Supabase (user's own DB)
    const { maybeGetOrgSupabaseClient } = await import('@/lib/server/org-supabase')
    const orgClient = await maybeGetOrgSupabaseClient(req)
    if (orgClient) {
      const { data, error } = await orgClient
        .from('reasoning_sessions')
        .select('id, created_at, problem, iterations, final_score, threshold_met, structured_outputs, provider, critique, evaluation_breakdown, feedback_history, output_types')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return NextResponse.json({ memory: data || [], source: 'org-supabase' })
    }

    // 2. Platform Supabase
    const supabase = await getPlatformClient()
    if (supabase) {
      const { data, error } = await supabase
        .from('reasoning_sessions')
        .select('id, created_at, problem, iterations, final_score, threshold_met, structured_outputs, provider, critique, evaluation_breakdown, feedback_history, output_types')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return NextResponse.json({ memory: data || [], source: 'platform-supabase' })
    }

    // 3. In-memory
    return NextResponse.json({ memory: listMemory(), source: 'memory' })
  } catch (e: any) {
    console.error('[/api/memory GET] error:', e)
    return NextResponse.json({ memory: [], error: e?.message, source: 'error' }, { status: 200 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { maybeGetOrgSupabaseClient } = await import('@/lib/server/org-supabase')
    const orgClient = await maybeGetOrgSupabaseClient(req)
    if (orgClient) {
      await orgClient.from('reasoning_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      return NextResponse.json({ memory: [], source: 'org-supabase' })
    }
    const supabase = await getPlatformClient()
    if (supabase) {
      await supabase.from('reasoning_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      return NextResponse.json({ memory: [], source: 'platform-supabase' })
    }
    clearMemory()
    return NextResponse.json({ memory: [], source: 'memory' })
  } catch (e: any) {
    console.error('[/api/memory DELETE] error:', e)
    return NextResponse.json({ memory: [], error: e?.message }, { status: 200 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { record } = body as { record: MemoryRecord }
    if (!record) return NextResponse.json({ error: 'record is required' }, { status: 400 })

    const insertPayload = {
      session_id: record.id,
      problem: record.problem,
      iterations: record.iterations,
      final_score: record.finalScore,
      threshold_met: record.thresholdMet,
      final_draft: record.finalDraft,
      structured_outputs: record.structuredOutputs ?? null,
      provider: record.provider ?? null,
      // Quality Console enrichment (JSONB)
      critique: record.critique ?? null,
      evaluation_breakdown: record.evaluationBreakdown ?? null,
      feedback_history: record.feedbackHistory ?? null,
      output_types: record.outputTypes ?? null,
    }

    const { maybeGetOrgSupabaseClient } = await import('@/lib/server/org-supabase')
    const orgClient = await maybeGetOrgSupabaseClient(req)
    if (orgClient) {
      const { error } = await orgClient.from('reasoning_sessions').insert(insertPayload)
      if (error) throw error
      return NextResponse.json({ success: true, source: 'org-supabase' })
    }

    const supabase = await getPlatformClient()
    if (supabase) {
      const { error } = await supabase.from('reasoning_sessions').insert(insertPayload)
      if (error) throw error
      return NextResponse.json({ success: true, source: 'platform-supabase' })
    }

    pushMemory(record)
    return NextResponse.json({ success: true, source: 'memory' })
  } catch (e: any) {
    console.error('[/api/memory POST] error:', e)
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
