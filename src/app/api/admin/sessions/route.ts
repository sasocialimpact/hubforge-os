// GET /api/admin/sessions - list all reasoning sessions with full quality detail.
//
// Auth: requires HUBFORGE_ADMIN_KEY env var + ?admin_key=... matching it.
//
// Query params:
//   admin_key  - required, must match HUBFORGE_ADMIN_KEY
//   limit      - default 50, max 200
//   offset     - default 0
//   min_score  - default 0
//   max_score  - default 100
//   provider   - optional, exact match
//   from       - optional, ISO date (inclusive)
//   to         - optional, ISO date (inclusive)
//
// Returns:
//   { sessions: [...], total, limit, offset, source }
//
// Data source:
//   1. Platform Supabase (SUPABASE_URL / SUPABASE_SERVICE_KEY env vars)
//   2. In-memory store (shared with /api/memory via src/lib/server/memory-store)
import { NextRequest, NextResponse } from 'next/server'
import { getPlatformClient } from '@/lib/server/platform-supabase'
import { listMemoryRaw } from '@/lib/server/memory-store'
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

// Normalize a single record (Supabase is snake_case, in-memory is camelCase)
// into a consistent shape the admin UI can render.
function normalizeRow(row: any) {
  if (!row) return null
  const fromMemory = 'finalScore' in row || 'timestamp' in row
  if (fromMemory) {
    return {
      id: row.id,
      problem: row.problem,
      finalScore: row.finalScore ?? 0,
      thresholdMet: !!row.thresholdMet,
      provider: row.provider ?? null,
      createdAt: row.timestamp ?? row.createdAt ?? null,
      iterations: row.iterations ?? 0,
      finalDraft: row.finalDraft ?? null,
      critique: row.critique ?? null,
      evaluationBreakdown: row.evaluationBreakdown ?? null,
      feedbackHistory: row.feedbackHistory ?? null,
      outputTypes: row.outputTypes ?? null,
    }
  }
  return {
    id: row.session_id ?? row.id,
    problem: row.problem,
    finalScore: row.final_score ?? 0,
    thresholdMet: !!row.threshold_met,
    provider: row.provider ?? null,
    createdAt: row.created_at ?? null,
    iterations: row.iterations ?? 0,
    finalDraft: row.final_draft ?? null,
    critique: row.critique ?? null,
    evaluationBreakdown: row.evaluation_breakdown ?? null,
    feedbackHistory: row.feedback_history ?? null,
    outputTypes: row.output_types ?? null,
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const adminKey = searchParams.get('admin_key')
    if (!requireAdminKey(adminKey)) {
      return NextResponse.json({ error: 'Invalid or missing admin key' }, { status: 403 })
    }

    const limit = Math.min(parseInt(searchParams.get('limit') || '50') || 50, 200)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0') || 0, 0)
    const minScore = Math.max(parseInt(searchParams.get('min_score') || '0') || 0, 0)
    const maxScore = Math.min(parseInt(searchParams.get('max_score') || '100') || 100, 100)
    const provider = searchParams.get('provider')?.trim() || null
    const from = searchParams.get('from') // ISO date string
    const to = searchParams.get('to')     // ISO date string

    let rows: any[] = []
    let source = 'memory'

    const supabase = await getPlatformClient()
    if (supabase) {
      let q = supabase
        .from('reasoning_sessions')
        .select('id, session_id, problem, created_at, iterations, final_score, threshold_met, provider, final_draft, critique, evaluation_breakdown, feedback_history, output_types, structured_outputs', { count: 'exact' })
        .order('created_at', { ascending: false })
      if (minScore > 0) q = q.gte('final_score', minScore)
      if (maxScore < 100) q = q.lte('final_score', maxScore)
      if (provider) q = q.eq('provider', provider)
      if (from) q = q.gte('created_at', from)
      if (to) q = q.lte('created_at', to)
      q = q.range(offset, offset + limit - 1)
      const { data, error, count } = await q
      if (error) throw error
      rows = data || []
      source = 'platform-supabase'
      const sessions = rows.map(normalizeRow).filter(Boolean)
      return NextResponse.json({
        sessions,
        total: count ?? sessions.length,
        limit,
        offset,
        source,
      })
    }

    // In-memory fallback - apply filters in JS.
    const all = listMemoryRaw()
      .map(normalizeRow)
      .filter(Boolean) as any[]
    // newest first
    all.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    const filtered = all.filter((r) => {
      if (r.finalScore < minScore || r.finalScore > maxScore) return false
      if (provider && r.provider !== provider) return false
      if (from && r.createdAt && r.createdAt < from) return false
      if (to && r.createdAt && r.createdAt > to) return false
      return true
    })
    const sliced = filtered.slice(offset, offset + limit)
    return NextResponse.json({
      sessions: sliced,
      total: filtered.length,
      limit,
      offset,
      source,
    })
  } catch (e: any) {
    console.error('[/api/admin/sessions GET] error:', e)
    return NextResponse.json({ error: e?.message, sessions: [], total: 0, limit: 50, offset: 0, source: 'error' }, { status: 500 })
  }
}
