'use client'

// Feedback Analysis - admin UI for surfacing patterns in user feedback.
//
// Pulls from /api/admin/feedback-analysis (which reads feedback_history JSONB
// across all reasoning_sessions). Surfaces:
//   - Overview cards (total feedback, sessions with feedback vs total)
//   - Top feedback patterns (horizontal bar chart of most common themes)
//   - Suggested prompt improvements (auto-generated from top patterns)
//   - Recent feedback list (scrollable, with score before/after where tracked)
//
// Style matches quality-console.tsx: amber accent, mono-font headers, dark-mode aware.

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, AlertTriangle, Loader2, Lightbulb, ListFilter,
  ChevronRight, TrendingUp, CheckCircle2, Sparkles, Copy, Check,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface FeedbackPattern {
  keyword: string
  count: number
  examples: string[]
}

interface RecentFeedback {
  sessionId: string
  createdAt: string | null
  problem: string
  feedback: string
  addressed: string[]
  scoreBefore: number | null
  scoreAfter: number | null
  finalScore: number
}

interface SuggestedImprovement {
  pattern: string
  count: number
  suggestion: string
}

interface FeedbackAnalysisData {
  totalFeedback: number
  sessionsWithFeedback: number
  totalSessions: number
  patterns: FeedbackPattern[]
  recent: RecentFeedback[]
  suggestedImprovements: SuggestedImprovement[]
  source: string
  error?: string
}

interface Props {
  adminKey: string
  refreshKey: number
}

function truncate(s: string, n: number): string {
  if (!s) return ''
  return s.length > n ? s.slice(0, n) + '…' : s
}

function scoreColor(score: number | null): string {
  if (score == null) return 'text-muted-foreground'
  if (score < 50) return 'text-red-600 dark:text-red-400'
  if (score < 70) return 'text-orange-600 dark:text-orange-400'
  if (score < 80) return 'text-amber-600 dark:text-amber-400'
  if (score < 90) return 'text-emerald-600 dark:text-emerald-400'
  return 'text-emerald-700 dark:text-emerald-300'
}

export function FeedbackAnalysis({ adminKey, refreshKey }: Props) {
  const [data, setData] = useState<FeedbackAnalysisData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null)
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null)
  const [copiedPattern, setCopiedPattern] = useState<string | null>(null)

  const fetch = useCallback(async (key: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/feedback-analysis?admin_key=${encodeURIComponent(key)}`)
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(j.error || `HTTP ${res.status}`)
      }
      const json = await res.json()
      setData(json)
      setError('')
    } catch (e: any) {
      setError(e.message)
      setData(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!adminKey) return
    fetch(adminKey)
  }, [adminKey, refreshKey, fetch])

  const copySuggestion = (pattern: string, suggestion: string) => {
    try {
      navigator.clipboard.writeText(suggestion)
      setCopiedPattern(pattern)
      setTimeout(() => setCopiedPattern(null), 1800)
    } catch {}
  }

  const maxPatternCount = data?.patterns?.length
    ? Math.max(...data.patterns.map((p) => p.count), 1)
    : 1

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-3 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <OverviewCard
          icon={<MessageSquare className="h-3.5 w-3.5 text-amber-600" />}
          label="Total feedback"
          value={data?.totalFeedback ?? 0}
          loading={loading}
        />
        <OverviewCard
          icon={<ListFilter className="h-3.5 w-3.5 text-amber-600" />}
          label="Sessions with feedback"
          value={data?.sessionsWithFeedback ?? 0}
          suffix={`/ ${data?.totalSessions ?? 0}`}
          loading={loading}
        />
        <OverviewCard
          icon={<TrendingUp className="h-3.5 w-3.5 text-amber-600" />}
          label="Feedback rate"
          value={
            data && data.totalSessions > 0
              ? Math.round((data.sessionsWithFeedback / data.totalSessions) * 100)
              : 0
          }
          suffix="%"
          loading={loading}
          valueClass={
            data && data.totalSessions > 0 && (data.sessionsWithFeedback / data.totalSessions) >= 0.2
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-amber-600 dark:text-amber-400'
          }
          hint="share of sessions where user gave feedback"
        />
        <OverviewCard
          icon={<Sparkles className="h-3.5 w-3.5 text-amber-600" />}
          label="Distinct patterns"
          value={data?.patterns?.length ?? 0}
          loading={loading}
          hint="keyword themes detected"
        />
      </div>

      {/* Top feedback patterns (bar chart) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-600" /> Top feedback patterns
            <span className="text-[10px] text-muted-foreground font-normal ml-1">click a row to see example feedback</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (!data || data.patterns.length === 0) ? (
            <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…
            </div>
          ) : !data || data.patterns.length === 0 ? (
            <div className="text-xs text-muted-foreground py-8 text-center">
              No feedback patterns detected yet. Feedback is recorded when users click "Improve" on a generated strategy.
            </div>
          ) : (
            <div className="space-y-1.5">
              {data.patterns.map((p) => (
                <div key={p.keyword}>
                  <button
                    type="button"
                    onClick={() => setExpandedPattern(expandedPattern === p.keyword ? null : p.keyword)}
                    className="w-full flex items-center gap-3 py-1 text-left hover:bg-amber-50/50 dark:hover:bg-amber-950/10 rounded px-1 -mx-1 transition-colors"
                  >
                    <motion.div animate={{ rotate: expandedPattern === p.keyword ? 90 : 0 }} transition={{ duration: 0.15 }}>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium capitalize truncate">{p.keyword}</span>
                        <span className="text-[10px] font-mono text-muted-foreground shrink-0">×{p.count}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded overflow-hidden">
                        <div
                          className="h-full bg-amber-500/70 rounded transition-all duration-500"
                          style={{ width: `${(p.count / maxPatternCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  </button>
                  <AnimatePresence initial={false}>
                    {expandedPattern === p.keyword && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-7 mt-1 mb-2 p-2 rounded-md border border-border bg-stone-50/50 dark:bg-stone-900/40 space-y-1.5">
                          <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                            Example feedback ({p.examples.length} shown)
                          </div>
                          {p.examples.map((ex, i) => (
                            <div key={i} className="text-[11px] italic text-muted-foreground border-l-2 border-amber-400 pl-2">
                              "{ex}"
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suggested improvements */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-600" /> Suggested prompt improvements
            <span className="text-[10px] text-muted-foreground font-normal ml-1">auto-generated from top 5 patterns · click to copy</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (!data || data.suggestedImprovements.length === 0) ? (
            <div className="h-20 flex items-center justify-center text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…
            </div>
          ) : !data || data.suggestedImprovements.length === 0 ? (
            <div className="text-xs text-muted-foreground py-4 text-center">
              No suggestions yet. Run a few strategies and gather feedback to see actionable prompt edits.
            </div>
          ) : (
            <div className="space-y-2">
              {data.suggestedImprovements.map((s) => (
                <div
                  key={s.pattern}
                  className="rounded-md border border-amber-200 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-900/50 p-3"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <Badge className="text-[9px] font-mono bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                        {s.pattern}
                      </Badge>
                      <span className="text-[10px] font-mono text-muted-foreground">×{s.count} mentions</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px] gap-1 shrink-0"
                      onClick={() => copySuggestion(s.pattern, s.suggestion)}
                    >
                      {copiedPattern === s.pattern ? (
                        <><Check className="h-3 w-3 text-emerald-600" /> Copied</>
                      ) : (
                        <><Copy className="h-3 w-3" /> Copy</>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed">{s.suggestion}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent feedback list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-amber-600" /> Recent feedback
            <Badge variant="outline" className="text-[9px] font-mono ml-1">{data?.recent?.length ?? 0} shown</Badge>
            <span className="text-[10px] text-muted-foreground font-normal ml-1">click a row to expand</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (!data || data.recent.length === 0) ? (
            <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…
            </div>
          ) : !data || data.recent.length === 0 ? (
            <div className="text-xs text-muted-foreground py-8 text-center">
              No feedback recorded yet. When users click "Improve" on a generated strategy, their feedback is saved here.
            </div>
          ) : (
            <ScrollArea className="h-[480px] rounded-md border border-border">
              <div className="divide-y divide-border">
                {data.recent.map((r, i) => {
                  const id = `${r.sessionId}-${i}`
                  const expanded = expandedFeedback === id
                  const hasScoreBefore = r.scoreBefore != null
                  const hasScoreAfter = r.scoreAfter != null
                  const delta =
                    hasScoreBefore && hasScoreAfter ? r.scoreAfter! - r.scoreBefore! : null
                  return (
                    <div key={id} className="p-2.5 hover:bg-amber-50/40 dark:hover:bg-amber-950/10 transition-colors">
                      <button
                        type="button"
                        onClick={() => setExpandedFeedback(expanded ? null : id)}
                        className="w-full text-left"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.15 }}>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          </motion.div>
                          <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                            {r.createdAt ? new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' }) : '-'}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground truncate">
                            {r.sessionId.slice(0, 14)}
                          </span>
                          <span className="ml-auto text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                            score:{' '}
                            <span className={cn('font-bold', scoreColor(r.scoreBefore))}>
                              {hasScoreBefore ? r.scoreBefore : '—'}
                            </span>
                            <span className="mx-0.5">→</span>
                            <span className={cn('font-bold', scoreColor(r.scoreAfter ?? r.finalScore))}>
                              {hasScoreAfter ? r.scoreAfter : r.finalScore}
                            </span>
                            {delta != null && (
                              <span className={cn('ml-1', delta > 0 ? 'text-emerald-600 dark:text-emerald-400' : delta < 0 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground')}>
                                ({delta > 0 ? '+' : ''}{delta})
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground truncate mb-0.5">
                          <span className="font-mono text-[9px] uppercase tracking-wider">problem:</span>{' '}
                          {r.problem || '(empty)'}
                        </div>
                        <div className="text-xs italic truncate">
                          "{truncate(r.feedback, 140)}"
                        </div>
                      </button>
                      <AnimatePresence initial={false}>
                        {expanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2 ml-5 space-y-2">
                              <div>
                                <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Full feedback</div>
                                <div className="text-xs italic p-2 rounded border border-border bg-stone-50/50 dark:bg-stone-900/40">
                                  "{r.feedback}"
                                </div>
                              </div>
                              {r.addressed.length > 0 && (
                                <div>
                                  <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                                    Changes the Feedback Engine made ({r.addressed.length})
                                  </div>
                                  <ul className="space-y-0.5">
                                    {r.addressed.map((a, j) => (
                                      <li key={j} className="text-xs flex items-start gap-1.5">
                                        <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0 mt-0.5" />
                                        <span>{a}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ---- Small overview card (matches QualityConsole styling) ----

function OverviewCard({
  icon, label, value, suffix, loading, valueClass, hint,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  suffix?: string
  loading?: boolean
  valueClass?: string
  hint?: string
}) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className={cn('text-lg font-bold', valueClass)}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <>
            {value}
            {suffix && <span className="text-xs text-muted-foreground font-normal ml-0.5">{suffix}</span>}
          </>
        )}
      </div>
      {hint && <div className="text-[9px] text-muted-foreground italic">{hint}</div>}
    </Card>
  )
}
