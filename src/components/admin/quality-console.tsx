'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Gauge, Target, AlertTriangle, CheckCircle2, XCircle, Filter, ChevronDown,
  ChevronRight, ListChecks, ClipboardList, Loader2, RotateCcw, MessageSquare,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface QualityStats {
  total: number
  avgScore: number
  avgIterations: number
  thresholdPassRate: number
  belowThreshold: number
  scoreDistribution: Record<string, number>
  providerComparison: { provider: string; count: number; avgScore: number; thresholdPassRate: number }[]
  commonIssues: { heuristic: string; count: number; severityBreakdown: Record<string, number> }[]
  source: string
}

interface SessionRow {
  id: string
  problem: string
  finalScore: number
  thresholdMet: boolean
  provider: string | null
  createdAt: string | null
  iterations: number
  finalDraft?: string | null
  critique?: any
  evaluationBreakdown?: any
  feedbackHistory?: { feedback: string; addressed: string[] }[] | null
  outputTypes?: string[] | null
}

interface Filters {
  minScore: number
  maxScore: number
  provider: string
  from: string
  to: string
}

const DEFAULT_FILTERS: Filters = { minScore: 0, maxScore: 100, provider: 'all', from: '', to: '' }

const SCORE_BUCKETS = [
  { key: '0-49', label: '0-49', color: 'bg-red-500' },
  { key: '50-69', label: '50-69', color: 'bg-orange-500' },
  { key: '70-79', label: '70-79', color: 'bg-amber-500' },
  { key: '80-89', label: '80-89', color: 'bg-emerald-500' },
  { key: '90-100', label: '90-100', color: 'bg-emerald-600' },
] as const

const QUALITY_THRESHOLD = 80

function scoreColor(score: number): string {
  if (score < 50) return 'text-red-600 dark:text-red-400'
  if (score < 70) return 'text-orange-600 dark:text-orange-400'
  if (score < 80) return 'text-amber-600 dark:text-amber-400'
  if (score < 90) return 'text-emerald-600 dark:text-emerald-400'
  return 'text-emerald-700 dark:text-emerald-300'
}

function severityBadgeClass(sev: string): string {
  const s = sev.toLowerCase()
  if (s === 'high') return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
  if (s === 'medium') return 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
  if (s === 'low') return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
  return 'bg-stone-100 text-stone-700 border-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700'
}

function truncate(s: string, n: number): string {
  if (!s) return ''
  return s.length > n ? s.slice(0, n) + '…' : s
}

export function QualityConsole({ adminKey, refreshKey }: { adminKey: string; refreshKey: number }) {
  const [stats, setStats] = useState<QualityStats | null>(null)
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [sessionsTotal, setSessionsTotal] = useState(0)
  const [statsLoading, setStatsLoading] = useState(false)
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [error, setError] = useState('')

  // Fetch aggregate stats (unfiltered - global quality overview).
  const fetchStats = useCallback(async (key: string) => {
    setStatsLoading(true)
    try {
      const res = await fetch(`/api/admin/quality-stats?admin_key=${encodeURIComponent(key)}`)
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(j.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setStats(data)
      setError('')
    } catch (e: any) {
      setError(e.message)
      setStats(null)
    }
    setStatsLoading(false)
  }, [])

  // Fetch session list (respects current filters).
  const fetchSessions = useCallback(async (key: string, f: Filters) => {
    setSessionsLoading(true)
    try {
      const params = new URLSearchParams({ admin_key: key, limit: '100', offset: '0' })
      if (f.minScore > 0) params.set('min_score', String(f.minScore))
      if (f.maxScore < 100) params.set('max_score', String(f.maxScore))
      if (f.provider && f.provider !== 'all') params.set('provider', f.provider)
      if (f.from) params.set('from', new Date(f.from).toISOString())
      if (f.to) params.set('to', new Date(f.to + 'T23:59:59').toISOString())
      const res = await fetch(`/api/admin/sessions?${params.toString()}`)
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(j.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setSessions(data.sessions || [])
      setSessionsTotal(data.total || 0)
      setError('')
    } catch (e: any) {
      setError(e.message)
      setSessions([])
    }
    setSessionsLoading(false)
  }, [])

  // Initial load + when admin refreshes.
  useEffect(() => {
    if (!adminKey) return
    fetchStats(adminKey)
    fetchSessions(adminKey, DEFAULT_FILTERS)
  }, [adminKey, refreshKey, fetchStats, fetchSessions])

  // Refetch sessions when filters change (debounced via setTimeout).
  useEffect(() => {
    if (!adminKey) return
    const t = setTimeout(() => fetchSessions(adminKey, filters), 350)
    return () => clearTimeout(t)
  }, [filters, adminKey, fetchSessions])

  const providerOptions = useMemo(() => {
    const set = new Set<string>()
    if (stats?.providerComparison) {
      for (const p of stats.providerComparison) if (p.provider) set.add(p.provider)
    }
    return Array.from(set).sort()
  }, [stats])

  const hasActiveFilters = filters.minScore > 0 || filters.maxScore < 100 || filters.provider !== 'all' || filters.from || filters.to
  const clearFilters = () => setFilters(DEFAULT_FILTERS)

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
          icon={<ClipboardList className="h-3.5 w-3.5 text-amber-600" />}
          label="Total strategies"
          value={stats?.total ?? 0}
          loading={statsLoading}
        />
        <OverviewCard
          icon={<Gauge className="h-3.5 w-3.5 text-amber-600" />}
          label="Avg quality score"
          value={stats?.avgScore ?? 0}
          suffix={`/100`}
          loading={statsLoading}
          valueClass={scoreColor(stats?.avgScore ?? 0)}
        />
        <OverviewCard
          icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
          label="Threshold pass rate"
          value={stats?.thresholdPassRate ?? 0}
          suffix="%"
          loading={statsLoading}
          valueClass={(stats?.thresholdPassRate ?? 0) >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}
        />
        <OverviewCard
          icon={<AlertTriangle className={cn('h-3.5 w-3.5', (stats?.belowThreshold ?? 0) > 0 ? 'text-red-500' : 'text-amber-600')} />}
          label="Below threshold"
          value={stats?.belowThreshold ?? 0}
          loading={statsLoading}
          valueClass={(stats?.belowThreshold ?? 0) > 0 ? 'text-red-600 dark:text-red-400' : ''}
          hint="needs attention"
        />
      </div>

      {/* Score distribution + Provider comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <Gauge className="h-4 w-4 text-amber-600" /> Score distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreDistributionChart distribution={stats?.scoreDistribution} loading={statsLoading} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <Target className="h-4 w-4 text-amber-600" /> Provider comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProviderComparisonTable rows={stats?.providerComparison ?? []} loading={statsLoading} />
          </CardContent>
        </Card>
      </div>

      {/* Common critique issues */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-amber-600" /> Common critique issues
            <span className="text-[10px] text-muted-foreground font-normal ml-1">top 10 across all strategies</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CommonIssuesList issues={stats?.commonIssues ?? []} loading={statsLoading} />
        </CardContent>
      </Card>

      {/* Filters + session list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Filter className="h-4 w-4 text-amber-600" /> Session explorer
            <Badge variant="outline" className="text-[9px] font-mono ml-1">{sessionsTotal} shown</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FilterControls
            filters={filters}
            onChange={setFilters}
            providerOptions={providerOptions}
            hasActiveFilters={hasActiveFilters}
            onClear={clearFilters}
          />

          {sessionsLoading && sessions.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-xs text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading sessions…
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 text-xs text-muted-foreground">
              No sessions match the current filters.
            </div>
          ) : (
            <ScrollArea className="h-[520px] rounded-md border border-border">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="text-[10px] font-mono uppercase w-6"></TableHead>
                    <TableHead className="text-[10px] font-mono uppercase">Date</TableHead>
                    <TableHead className="text-[10px] font-mono uppercase">Problem</TableHead>
                    <TableHead className="text-[10px] font-mono uppercase text-right">Score</TableHead>
                    <TableHead className="text-[10px] font-mono uppercase">Provider</TableHead>
                    <TableHead className="text-[10px] font-mono uppercase">Threshold</TableHead>
                    <TableHead className="text-[10px] font-mono uppercase text-right">Iter</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((s) => (
                    <SessionRowItem
                      key={s.id}
                      session={s}
                      expanded={expandedId === s.id}
                      onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)}
                    />
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ---- Sub-components ----

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
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <>{value}{suffix && <span className="text-xs text-muted-foreground font-normal ml-0.5">{suffix}</span>}</>}
      </div>
      {hint && <div className="text-[9px] text-muted-foreground italic">{hint}</div>}
    </Card>
  )
}

function ScoreDistributionChart({ distribution, loading }: { distribution?: Record<string, number>; loading: boolean }) {
  if (loading && !distribution) {
    return <div className="h-32 flex items-center justify-center text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…</div>
  }
  if (!distribution) return <div className="text-xs text-muted-foreground">No data.</div>
  const max = Math.max(...SCORE_BUCKETS.map((b) => distribution[b.key] || 0), 1)
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2 h-32">
        {SCORE_BUCKETS.map((b) => {
          const v = distribution[b.key] || 0
          return (
            <div key={b.key} className="flex-1 flex flex-col items-center gap-1">
              <div className="text-[10px] font-mono font-bold">{v}</div>
              <div className="w-full bg-muted rounded-t-sm relative overflow-hidden" style={{ height: '100%' }}>
                <div
                  className={cn('absolute bottom-0 left-0 right-0 rounded-t-sm transition-all duration-500', b.color)}
                  style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? '4px' : '0' }}
                />
              </div>
              <div className="text-[9px] font-mono text-muted-foreground">{b.label}</div>
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-2 text-[9px] text-muted-foreground pt-1 border-t border-border">
        <span className="font-mono">Threshold: {QUALITY_THRESHOLD}</span>
        <span>·</span>
        <span>Strategies scoring 80+ are considered publication-ready.</span>
      </div>
    </div>
  )
}

function ProviderComparisonTable({ rows, loading }: { rows: { provider: string; count: number; avgScore: number; thresholdPassRate: number }[]; loading: boolean }) {
  if (loading && rows.length === 0) {
    return <div className="h-32 flex items-center justify-center text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…</div>
  }
  if (rows.length === 0) return <div className="text-xs text-muted-foreground py-4 text-center">No provider data yet.</div>
  const maxCount = Math.max(...rows.map((r) => r.count), 1)
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-[10px] font-mono uppercase">Provider</TableHead>
          <TableHead className="text-[10px] font-mono uppercase text-right">Runs</TableHead>
          <TableHead className="text-[10px] font-mono uppercase text-right">Avg</TableHead>
          <TableHead className="text-[10px] font-mono uppercase">Pass rate</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.provider}>
            <TableCell className="text-xs font-medium truncate max-w-[180px]">{r.provider || 'unknown'}</TableCell>
            <TableCell className="text-xs font-mono text-right">
              <div className="flex items-center justify-end gap-1.5">
                <div className="w-12 h-1.5 bg-muted rounded overflow-hidden">
                  <div className="h-full bg-amber-500/60 rounded" style={{ width: `${(r.count / maxCount) * 100}%` }} />
                </div>
                {r.count}
              </div>
            </TableCell>
            <TableCell className={cn('text-xs font-mono text-right font-bold', scoreColor(r.avgScore))}>{r.avgScore}</TableCell>
            <TableCell className="text-xs">
              <div className="flex items-center gap-1.5">
                <div className="flex-1 h-1.5 bg-muted rounded overflow-hidden min-w-[40px]">
                  <div
                    className={cn('h-full rounded', r.thresholdPassRate >= 70 ? 'bg-emerald-500' : 'bg-amber-500')}
                    style={{ width: `${r.thresholdPassRate}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] w-8 text-right">{r.thresholdPassRate}%</span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function CommonIssuesList({ issues, loading }: { issues: { heuristic: string; count: number; severityBreakdown: Record<string, number> }[]; loading: boolean }) {
  if (loading && issues.length === 0) {
    return <div className="h-32 flex items-center justify-center text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…</div>
  }
  if (issues.length === 0) return <div className="text-xs text-muted-foreground py-4 text-center">No critique issues recorded yet. Run a strategy to populate this.</div>
  const maxCount = Math.max(...issues.map((i) => i.count), 1)
  return (
    <div className="space-y-1.5">
      {issues.map((iss, i) => (
        <div key={iss.heuristic + i} className="flex items-center gap-3 py-1">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium truncate">{iss.heuristic}</span>
              <span className="text-[10px] font-mono text-muted-foreground shrink-0">×{iss.count}</span>
            </div>
            <div className="h-1.5 bg-muted rounded overflow-hidden">
              <div className="h-full bg-amber-500/60 rounded" style={{ width: `${(iss.count / maxCount) * 100}%` }} />
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            {(['high', 'medium', 'low'] as const).map((sev) => {
              const c = iss.severityBreakdown[sev] || 0
              if (!c) return null
              return (
                <Badge key={sev} variant="outline" className={cn('text-[9px] font-mono py-0 px-1.5 h-4', severityBadgeClass(sev))}>
                  {sev[0].toUpperCase()}{c}
                </Badge>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function FilterControls({
  filters, onChange, providerOptions, hasActiveFilters, onClear,
}: {
  filters: Filters
  onChange: (f: Filters) => void
  providerOptions: string[]
  hasActiveFilters: boolean
  onClear: () => void
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 rounded-md border border-border bg-stone-50/50 dark:bg-stone-900/40">
      {/* Score range slider */}
      <div className="space-y-1.5">
        <label className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground flex justify-between">
          <span>Score range</span>
          <span className="font-bold">{filters.minScore} - {filters.maxScore}</span>
        </label>
        <Slider
          value={[filters.minScore, filters.maxScore]}
          min={0}
          max={100}
          step={5}
          onValueChange={(vals) => onChange({ ...filters, minScore: vals[0], maxScore: vals[1] })}
          className="mt-3"
        />
      </div>

      {/* Provider dropdown */}
      <div className="space-y-1.5">
        <label className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Provider</label>
        <Select value={filters.provider} onValueChange={(v) => onChange({ ...filters, provider: v })}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All providers" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All providers</SelectItem>
            {providerOptions.map((p) => (
              <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date from */}
      <div className="space-y-1.5">
        <label className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">From</label>
        <Input
          type="date"
          value={filters.from}
          onChange={(e) => onChange({ ...filters, from: e.target.value })}
          className="h-8 text-xs"
        />
      </div>

      {/* Date to + clear */}
      <div className="space-y-1.5">
        <label className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">To</label>
        <div className="flex gap-2">
          <Input
            type="date"
            value={filters.to}
            onChange={(e) => onChange({ ...filters, to: e.target.value })}
            className="h-8 text-xs flex-1"
          />
          {hasActiveFilters && (
            <Button variant="outline" size="sm" className="h-8 px-2 text-xs gap-1 shrink-0" onClick={onClear}>
              <RotateCcw className="h-3 w-3" /> Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function SessionRowItem({ session, expanded, onToggle }: { session: SessionRow; expanded: boolean; onToggle: () => void }) {
  return (
    <>
      <TableRow
        onClick={onToggle}
        className="cursor-pointer hover:bg-amber-50/50 dark:hover:bg-amber-950/10 transition-colors"
      >
        <TableCell className="p-2 w-6">
          <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.15 }}>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </motion.div>
        </TableCell>
        <TableCell className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
          {session.createdAt ? new Date(session.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' }) : '-'}
        </TableCell>
        <TableCell className="text-xs max-w-[280px] truncate">{truncate(session.problem, 80)}</TableCell>
        <TableCell className={cn('text-xs font-mono font-bold text-right', scoreColor(session.finalScore))}>{session.finalScore}</TableCell>
        <TableCell className="text-[10px] text-muted-foreground truncate max-w-[140px]">{session.provider || '-'}</TableCell>
        <TableCell className="text-xs">
          {session.thresholdMet ? (
            <Badge variant="outline" className="text-[9px] font-mono py-0 px-1.5 h-4 bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
              <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> PASS
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[9px] font-mono py-0 px-1.5 h-4 bg-red-50 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800">
              <XCircle className="h-2.5 w-2.5 mr-0.5" /> FAIL
            </Badge>
          )}
        </TableCell>
        <TableCell className="text-[10px] font-mono text-right text-muted-foreground">{session.iterations || '-'}</TableCell>
      </TableRow>
      <AnimatePresence>
        {expanded && (
          <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-stone-50/70 dark:bg-stone-900/40"
          >
            <td colSpan={7} className="p-4 border-t border-border">
              <SessionDetail session={session} />
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  )
}

function SessionDetail({ session }: { session: SessionRow }) {
  const critiqueIssues: any[] = Array.isArray(session.critique?.issues) ? session.critique.issues : []
  const evalScores: any[] = Array.isArray(session.evaluationBreakdown?.scores) ? session.evaluationBreakdown.scores : []
  const feedback: { feedback: string; addressed: string[] }[] = Array.isArray(session.feedbackHistory) ? session.feedbackHistory : []
  const outputTypes: string[] = Array.isArray(session.outputTypes) ? session.outputTypes : []

  return (
    <div className="space-y-4">
      {/* Full problem */}
      <div>
        <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Problem</div>
        <div className="text-xs leading-relaxed bg-background border border-border rounded p-3 max-h-32 overflow-y-auto">
          {session.problem || <span className="text-muted-foreground italic">No problem recorded.</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Critique issues */}
        <div>
          <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
            <ListChecks className="h-3 w-3 text-amber-600" /> Critique issues ({critiqueIssues.length})
          </div>
          <div className="bg-background border border-border rounded p-2 max-h-48 overflow-y-auto space-y-1">
            {critiqueIssues.length === 0 ? (
              <div className="text-[10px] text-muted-foreground italic p-1">No critique issues recorded.</div>
            ) : (
              critiqueIssues.map((iss, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] py-1 border-b border-border last:border-0">
                  <Badge variant="outline" className={cn('text-[9px] font-mono py-0 px-1.5 h-4 shrink-0 mt-0.5', severityBadgeClass(iss.severity))}>
                    {iss.severity}
                  </Badge>
                  <div className="min-w-0">
                    <div className="font-medium text-[10px] font-mono text-amber-700 dark:text-amber-400">{iss.heuristic}</div>
                    <div className="text-muted-foreground">{iss.description}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Evaluation breakdown */}
        <div>
          <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
            <Gauge className="h-3 w-3 text-amber-600" /> Evaluation breakdown
            {session.evaluationBreakdown?.overall != null && (
              <span className={cn('font-mono font-bold ml-auto', scoreColor(session.evaluationBreakdown.overall))}>
                {session.evaluationBreakdown.overall}/100
              </span>
            )}
          </div>
          <div className="bg-background border border-border rounded p-2 max-h-48 overflow-y-auto space-y-1.5">
            {evalScores.length === 0 ? (
              <div className="text-[10px] text-muted-foreground italic p-1">No per-criterion scores recorded.</div>
            ) : (
              evalScores.map((sc, i) => (
                <div key={i} className="space-y-0.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-medium">{sc.criterion}</span>
                    <span className={cn('font-mono font-bold', scoreColor(Number(sc.score) || 0))}>{sc.score}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded overflow-hidden">
                    <div
                      className={cn('h-full rounded', (Number(sc.score) || 0) >= 80 ? 'bg-emerald-500' : (Number(sc.score) || 0) >= 60 ? 'bg-amber-500' : 'bg-red-500')}
                      style={{ width: `${Math.min(100, Number(sc.score) || 0)}%` }}
                    />
                  </div>
                  {sc.rationale && <div className="text-[9px] text-muted-foreground italic">{sc.rationale}</div>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* User feedback history */}
      <div>
        <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
          <MessageSquare className="h-3 w-3 text-amber-600" /> User feedback ({feedback.length})
          {outputTypes.length > 0 && (
            <span className="ml-auto text-[9px] font-mono">outputs: {outputTypes.join(', ')}</span>
          )}
        </div>
        <div className="bg-background border border-border rounded p-2 max-h-32 overflow-y-auto space-y-1.5">
          {feedback.length === 0 ? (
            <div className="text-[10px] text-muted-foreground italic p-1">No user feedback recorded for this session.</div>
          ) : (
            feedback.map((f, i) => (
              <div key={i} className="text-[11px] py-1 border-b border-border last:border-0">
                <div className="text-muted-foreground italic">"{f.feedback}"</div>
                {f.addressed && f.addressed.length > 0 && (
                  <div className="text-[9px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Addressed: {f.addressed.join('; ')}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
