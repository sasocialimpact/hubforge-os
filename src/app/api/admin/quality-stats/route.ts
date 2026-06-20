// GET /api/admin/quality-stats - aggregate quality statistics across sessions.
//
// Auth: requires HUBFORGE_ADMIN_KEY env var + ?admin_key=... matching it.
//
// Returns:
//   {
//     total, avgScore, avgIterations, thresholdPassRate, belowThreshold,
//     scoreDistribution: { '0-49', '50-69', '70-79', '80-89', '90-100' },
//     providerComparison: [{ provider, count, avgScore, thresholdPassRate }],
//     commonIssues: [{ heuristic, count, severityBreakdown }],
//     source
//   }
//
// Data source:
//   1. Platform Supabase (reads all sessions)
//   2. In-memory store (shared with /api/memory)
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

function bucketFor(score: number): keyof typeof EMPTY_BUCKETS {
  if (score < 50) return '0-49'
  if (score < 70) return '50-69'
  if (score < 80) return '70-79'
  if (score < 90) return '80-89'
  return '90-100'
}

const EMPTY_BUCKETS = { '0-49': 0, '50-69': 0, '70-79': 0, '80-89': 0, '90-100': 0 }

function normalizeRow(row: any) {
  if (!row) return null
  const fromMemory = 'finalScore' in row || 'timestamp' in row
  if (fromMemory) {
    return {
      finalScore: row.finalScore ?? 0,
      thresholdMet: !!row.thresholdMet,
      provider: row.provider ?? null,
      createdAt: row.timestamp ?? row.createdAt ?? null,
      iterations: row.iterations ?? 0,
      critique: row.critique ?? null,
    }
  }
  return {
    finalScore: row.final_score ?? 0,
    thresholdMet: !!row.threshold_met,
    provider: row.provider ?? null,
    createdAt: row.created_at ?? null,
    iterations: row.iterations ?? 0,
    critique: row.critique ?? null,
  }
}

function computeStats(rows: any[]) {
  const total = rows.length
  const scores = rows.map((r) => Number(r.finalScore) || 0)
  const sumScore = scores.reduce((a, b) => a + b, 0)
  const avgScore = total ? Math.round(sumScore / total) : 0

  const iterArr = rows.map((r) => Number(r.iterations) || 0).filter((n) => n > 0)
  const avgIterations = iterArr.length ? Math.round((iterArr.reduce((a, b) => a + b, 0) / iterArr.length) * 10) / 10 : 0

  const passed = rows.filter((r) => r.thresholdMet).length
  const thresholdPassRate = total ? Math.round((passed / total) * 100) : 0
  const belowThreshold = total - passed

  const scoreDistribution = { ...EMPTY_BUCKETS }
  for (const s of scores) scoreDistribution[bucketFor(s)]++

  // Provider comparison
  const byProvider: Record<string, { count: number; sum: number; passed: number }> = {}
  for (const r of rows) {
    const p = r.provider || 'unknown'
    if (!byProvider[p]) byProvider[p] = { count: 0, sum: 0, passed: 0 }
    byProvider[p].count++
    byProvider[p].sum += Number(r.finalScore) || 0
    if (r.thresholdMet) byProvider[p].passed++
  }
  const providerComparison = Object.entries(byProvider)
    .map(([provider, v]) => ({
      provider,
      count: v.count,
      avgScore: v.count ? Math.round(v.sum / v.count) : 0,
      thresholdPassRate: v.count ? Math.round((v.passed / v.count) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)

  // Common critique issues - aggregate across all sessions that have critique data.
  // critique shape: { issues: [{ severity, heuristic, description }], summary }
  const issueAgg: Record<string, { count: number; severity: Record<string, number> }> = {}
  for (const r of rows) {
    const issues = r.critique?.issues
    if (!Array.isArray(issues)) continue
    for (const iss of issues) {
      const h = (iss?.heuristic || 'unknown').toString().trim()
      if (!h) continue
      if (!issueAgg[h]) issueAgg[h] = { count: 0, severity: {} }
      issueAgg[h].count++
      const sev = (iss?.severity || 'unknown').toString().toLowerCase()
      issueAgg[h].severity[sev] = (issueAgg[h].severity[sev] || 0) + 1
    }
  }
  const commonIssues = Object.entries(issueAgg)
    .map(([heuristic, v]) => ({ heuristic, count: v.count, severityBreakdown: v.severity }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return {
    total,
    avgScore,
    avgIterations,
    thresholdPassRate,
    belowThreshold,
    scoreDistribution,
    providerComparison,
    commonIssues,
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const adminKey = searchParams.get('admin_key')
    if (!requireAdminKey(adminKey)) {
      return NextResponse.json({ error: 'Invalid or missing admin key' }, { status: 403 })
    }

    const supabase = await getPlatformClient()
    if (supabase) {
      const { data, error } = await supabase
        .from('reasoning_sessions')
        .select('final_score, threshold_met, provider, created_at, iterations, critique')
        .order('created_at', { ascending: false })
        .limit(10000)
      if (error) throw error
      const rows = (data || []).map(normalizeRow).filter(Boolean) as any[]
      return NextResponse.json({ ...computeStats(rows), source: 'platform-supabase' })
    }

    const rows = listMemoryRaw().map(normalizeRow).filter(Boolean) as any[]
    return NextResponse.json({ ...computeStats(rows), source: 'memory' })
  } catch (e: any) {
    console.error('[/api/admin/quality-stats GET] error:', e)
    return NextResponse.json({ error: e?.message, source: 'error' }, { status: 500 })
  }
}
