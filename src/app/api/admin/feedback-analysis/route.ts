// GET /api/admin/feedback-analysis - aggregate feedback across all sessions
// and group by keyword patterns.
//
// Auth: requires HUBFORGE_ADMIN_KEY env var + ?admin_key=... matching it.
//
// Returns:
//   {
//     totalFeedback: number,                // total feedback entries across all sessions
//     sessionsWithFeedback: number,         // distinct sessions with at least 1 feedback entry
//     totalSessions: number,                // total sessions considered
//     patterns: [{
//       keyword: string,                    // "sustainability", "indicators", "budget", etc.
//       count: number,                      // how many feedback entries matched this keyword
//       examples: string[]                  // up to 5 sample feedback texts (truncated)
//     }],
//     recent: [{                            // most recent 100 feedback entries
//       sessionId: string,
//       createdAt: string | null,           // session created_at (proxy for feedback date)
//       problem: string,                    // truncated to 100 chars
//       feedback: string,                   // full feedback text
//       addressed: string[],                // list of changes the feedback engine made
//       scoreBefore: number | null,         // score before this feedback round (if tracked)
//       scoreAfter: number | null,          // score after this feedback round (if tracked)
//       finalScore: number                  // session's final score (always available)
//     }],
//     suggestedImprovements: [{             // auto-generated from patterns
//       pattern: string,
//       count: number,
//       suggestion: string                  // concrete prompt-edit suggestion
//     }],
//     source: string
//   }
//
// Pattern detection: case-insensitive word-boundary match against a fixed
// keyword list (sustainability, indicators, budget, risks, assumptions,
// vague, specific, evidence, stakeholder, timeline, monitoring, target,
// cost, beneficiary, methodology, data). A single feedback entry can match
// multiple patterns (e.g. "make sustainability indicators more specific"
// matches sustainability, indicators, specific).
import { NextRequest, NextResponse } from 'next/server'
import { getPlatformClient } from '@/lib/server/platform-supabase'
import { listMemoryRaw } from '@/lib/server/memory-store'

export const maxDuration = 10

function requireAdminKey(provided: string | null): boolean {
  const expected = process.env.HUBFORGE_ADMIN_KEY
  if (!expected) return false
  if (!provided) return false
  if (provided.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < provided.length; i++) diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i)
  return diff === 0
}

// Keyword list - mix of topical themes (sustainability, indicators, budget,
// risks, assumptions, evidence, stakeholder) and quality modifiers (vague,
// specific). Curated to surface the most actionable improvement signals.
const PATTERNS: { keyword: string; regex: RegExp }[] = [
  { keyword: 'sustainability', regex: /\bsustainab(le|ility)\b/i },
  { keyword: 'indicators', regex: /\bindicator(s)?\b/i },
  { keyword: 'budget', regex: /\bbudget|cost|funding|financial\b/i },
  { keyword: 'risks', regex: /\brisk(s)?\b/i },
  { keyword: 'assumptions', regex: /\bassumption(s)?\b/i },
  { keyword: 'vague', regex: /\bvague|generic|abstract|unclear\b/i },
  { keyword: 'specific', regex: /\bspecific|concrete|detailed|precise\b/i },
  { keyword: 'evidence', regex: /\bevidence|citation(s)?|source(s)?\b/i },
  { keyword: 'stakeholder', regex: /\bstakeholder(s)?|partner(s)?\b/i },
  { keyword: 'timeline', regex: /\btimeline|schedule|deadline|timeframe\b/i },
  { keyword: 'monitoring', regex: /\bmonitor(ing)?|track(ing)?|measur(e|ing)\b/i },
  { keyword: 'target', regex: /\btarget(s)?|goal(s)?|objective(s)?\b/i },
  { keyword: 'beneficiary', regex: /\bbeneficiar(y|ies)|population|community\b/i },
  { keyword: 'methodology', regex: /\bmethodology|approach|method\b/i },
  { keyword: 'data', regex: /\bdata|baseline|metric\b/i },
  { keyword: 'logframe', regex: /\blogframe|logical framework\b/i },
  { keyword: 'theory of change', regex: /\btheory of change|toc\b/i },
  { keyword: 'exit', regex: /\bexit|handover|transition\b/i },
]

// Map a pattern keyword to a concrete prompt-edit suggestion the admin can
// apply to the reasoning engine's system prompt. These are deliberately
// copy-pasteable lines.
const SUGGESTION_BY_PATTERN: Record<string, string> = {
  sustainability: 'Add to the Reasoning Engine prompt: "Always include a detailed sustainability/exit strategy section with a named responsible party, funding source for continuation, and a 3-year handover plan."',
  indicators: 'Add to the Reasoning Engine prompt: "Every Indicator Framework row must include: indicator name, unit, baseline value with source, target value with deadline, frequency of measurement, and responsible party."',
  budget: 'Add to the Reasoning Engine prompt: "Include a Budget section with line items grouped by activity, unit cost, quantity, total per line, and a 10% contingency line. State currency explicitly."',
  risks: 'Add to the Reasoning Engine prompt: "List at least 5 risks. Each risk row: risk, likelihood (low/med/high), impact (low/med/high), mitigation owner, mitigation action, trigger indicator."',
  assumptions: 'Add to the Reasoning Engine prompt: "List at least 5 key assumptions. Each assumption: statement, plausibility note (high/med/low + one-line justification), and what would invalidate it."',
  vague: 'Add to the Reasoning Engine prompt: "Ban vague qualifiers (improve, enhance, strengthen, support). Replace every vague phrase with a measurable target (number + unit + deadline)."',
  specific: 'Add to the Reasoning Engine prompt: "Every target must be SMART: include a specific number, unit, baseline, target value, deadline, and responsible party. Reject any objective that lacks a measurable outcome."',
  evidence: 'Add to the Reasoning Engine prompt: "Every empirical claim must cite an Evidence Library item by [E#] ID. Uncited claims must be marked as program-team assumptions."',
  stakeholder: 'Add to the Reasoning Engine prompt: "List every stakeholder with: name (or org), role (beneficiary/implementer/influencer/funder), responsibility, and contribution to the project."',
  timeline: 'Add to the Reasoning Engine prompt: "Include a Gantt-style workplan: every activity has a start month, end month, duration in weeks, and a named owner. Use a 12-month horizon minimum."',
  monitoring: 'Add to the Reasoning Engine prompt: "Include a Monitoring & Evaluation Plan: indicators, data collection method, frequency, responsible party, reporting cadence, and learning questions."',
  target: 'Add to the Reasoning Engine prompt: "Every objective must state its target value explicitly. If a target is missing from the user problem, propose one based on industry benchmarks and flag it as an assumption."',
  beneficiary: 'Add to the Reasoning Engine prompt: "Name the target population explicitly: who (segment), how many (count), where (geography), and why (vulnerability criterion). Avoid generic terms like community members."',
  methodology: 'Add to the Reasoning Engine prompt: "State the methodological approach explicitly for every activity: what method, why this method over alternatives, sample size if applicable, and how data quality will be assured."',
  data: 'Add to the Reasoning Engine prompt: "Every Indicator Framework row must cite a baseline data source. If no baseline exists, name the baseline study that will be conducted and by when."',
  logframe: 'Add to the Reasoning Engine prompt: "Always include a Logframe section with 4 levels (Goal / Purpose / Outputs / Activities), each row containing: description, OVI, MoV, assumptions."',
  'theory of change': 'Add to the Reasoning Engine prompt: "Always include a Theory of Change section with: target population, inputs, activities, outputs, outcomes, impact, assumptions, and external factors."',
  exit: 'Add to the Reasoning Engine prompt: "Include an Exit/Sustainability Strategy section: handover timeline, responsible party, capacity-building plan, and funding source for post-project continuation."',
}

interface FeedbackEntry {
  feedback: string
  addressed?: string[]
  scoreBefore?: number | null
  scoreAfter?: number | null
  createdAt?: string | null
}

interface SessionFeedback {
  sessionId: string
  createdAt: string | null
  problem: string
  finalScore: number
  feedbackHistory: FeedbackEntry[] | null
}

function normalizeRow(row: any): SessionFeedback | null {
  if (!row) return null
  const fromMemory = 'finalScore' in row || 'timestamp' in row
  if (fromMemory) {
    return {
      sessionId: String(row.id ?? ''),
      createdAt: row.timestamp ?? row.createdAt ?? null,
      problem: String(row.problem ?? ''),
      finalScore: Number(row.finalScore ?? 0),
      feedbackHistory: Array.isArray(row.feedbackHistory) ? row.feedbackHistory : null,
    }
  }
  return {
    sessionId: String(row.session_id ?? row.id ?? ''),
    createdAt: row.created_at ?? null,
    problem: String(row.problem ?? ''),
    finalScore: Number(row.final_score ?? 0),
    feedbackHistory: Array.isArray(row.feedback_history) ? row.feedbackHistory : null,
  }
}

function truncate(s: string, n: number): string {
  if (!s) return ''
  return s.length > n ? s.slice(0, n) + '…' : s
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    if (!requireAdminKey(searchParams.get('admin_key'))) {
      return NextResponse.json({ error: 'Invalid or missing admin key' }, { status: 403 })
    }

    // Pull all sessions that have a feedback_history array. We don't filter at
    // the DB level because the feedback_history column is JSONB and the
    // emptiness check is cheaper in JS than in PostgREST.
    let rows: SessionFeedback[] = []
    let source = 'memory'
    const supabase = await getPlatformClient()
    if (supabase) {
      const { data, error } = await supabase
        .from('reasoning_sessions')
        .select('id, session_id, problem, created_at, final_score, feedback_history')
        .order('created_at', { ascending: false })
        .limit(10000)
      if (error) throw error
      rows = ((data || []).map(normalizeRow).filter(Boolean) as SessionFeedback[])
      source = 'platform-supabase'
    } else {
      rows = listMemoryRaw().map(normalizeRow).filter(Boolean) as SessionFeedback[]
    }

    const totalSessions = rows.length
    let totalFeedback = 0
    let sessionsWithFeedback = 0

    // Per-keyword aggregation: count + examples (up to 5).
    const patternAgg: Record<string, { count: number; examples: string[] }> = {}
    for (const p of PATTERNS) patternAgg[p.keyword] = { count: 0, examples: [] }

    const recent: any[] = []

    for (const s of rows) {
      if (!s.feedbackHistory || s.feedbackHistory.length === 0) continue
      sessionsWithFeedback++
      for (const entry of s.feedbackHistory) {
        if (!entry || !entry.feedback || typeof entry.feedback !== 'string') continue
        totalFeedback++
        const fb = entry.feedback
        for (const p of PATTERNS) {
          if (p.regex.test(fb)) {
            patternAgg[p.keyword].count++
            if (patternAgg[p.keyword].examples.length < 5) {
              patternAgg[p.keyword].examples.push(truncate(fb, 160))
            }
          }
        }
        recent.push({
          sessionId: s.sessionId,
          createdAt: entry.createdAt ?? s.createdAt,
          problem: truncate(s.problem, 100),
          feedback: fb,
          addressed: Array.isArray(entry.addressed) ? entry.addressed : [],
          scoreBefore: entry.scoreBefore ?? null,
          scoreAfter: entry.scoreAfter ?? null,
          finalScore: s.finalScore,
        })
      }
    }

    // Sort patterns by count desc, drop zero-count ones (UI shows top N).
    const patterns = Object.entries(patternAgg)
      .map(([keyword, v]) => ({ keyword, count: v.count, examples: v.examples }))
      .filter((p) => p.count > 0)
      .sort((a, b) => b.count - a.count)

    // Recent feedback: newest first, cap at 100.
    recent.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    const recentCapped = recent.slice(0, 100)

    // Suggested improvements: top 5 patterns by count, mapped to suggestions.
    const suggestedImprovements = patterns
      .slice(0, 5)
      .map((p) => ({
        pattern: p.keyword,
        count: p.count,
        suggestion: SUGGESTION_BY_PATTERN[p.keyword] || `Users frequently mention "${p.keyword}". Review the Reasoning Engine prompt and add a directive that addresses this theme.`,
      }))

    return NextResponse.json({
      totalFeedback,
      sessionsWithFeedback,
      totalSessions,
      patterns,
      recent: recentCapped,
      suggestedImprovements,
      source,
    })
  } catch (e: any) {
    console.error('[/api/admin/feedback-analysis GET] error:', e)
    return NextResponse.json(
      {
        error: e?.message ?? 'Internal error',
        totalFeedback: 0,
        sessionsWithFeedback: 0,
        totalSessions: 0,
        patterns: [],
        recent: [],
        suggestedImprovements: [],
        source: 'error',
      },
      { status: 500 }
    )
  }
}
