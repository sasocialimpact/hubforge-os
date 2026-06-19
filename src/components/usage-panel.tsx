'use client'

import { useState } from 'react'
import { Zap, TrendingDown, Trash2, BarChart3, CheckCircle2, ArrowRight, Gauge } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getUsageSummary, getOptimizationTips, clearUsage, type UsageSummary } from '@/lib/usage-tracker'
import { getStoredProviderConfig } from '@/lib/providers'
import { useRateLimit } from '@/lib/use-rate-limit'
import { cn } from '@/lib/utils'

interface UsagePanelProps {
  /** Opens the AI provider settings dialog (so the "add your own key" CTA can deep-link). */
  onOpenSettings?: () => void
}

export function UsagePanel({ onOpenSettings }: UsagePanelProps = {}) {
  const [summary, setSummary] = useState<UsageSummary>(() => getUsageSummary())
  const [provider] = useState(() => getStoredProviderConfig().provider)
  const rateLimit = useRateLimit(provider)
  const tips = getOptimizationTips(summary)

  const handleClear = () => {
    clearUsage()
    setSummary(getUsageSummary())
  }

  const maxDailyCalls = Math.max(...summary.last7Days.map((d) => d.calls), 1)

  // Progress bar colour buckets per spec:
  //   amber  -> used < 3 (plenty left)
  //   orange -> used 3-4 (running low)
  //   red    -> used >= 5 (limit reached)
  const rl = rateLimit
  const rlPct = rl.limit > 0 ? Math.min(100, (rl.used / rl.limit) * 100) : 0
  const rlBarColor = rl.used >= rl.limit
    ? 'bg-red-500'
    : rl.used >= 3
      ? 'bg-orange-500'
      : 'bg-amber-500'
  const rlTextColor = rl.used >= rl.limit
    ? 'text-red-600 dark:text-red-400'
    : rl.used >= 3
      ? 'text-orange-600 dark:text-orange-400'
      : 'text-amber-700 dark:text-amber-400'

  // CTA: prefer callback (deep-link to settings dialog), fall back to /help.
  const keyCta = onOpenSettings ? (
    <button
      type="button"
      onClick={onOpenSettings}
      className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline mt-1.5 flex items-center gap-1"
    >
      Add your own API key for unlimited strategies <ArrowRight className="h-3 w-3" />
    </button>
  ) : (
    <a
      href="/help"
      className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline mt-1.5 flex items-center gap-1"
    >
      Add your own API key for unlimited strategies <ArrowRight className="h-3 w-3" />
    </a>
  )

  return (
    <div className="space-y-4">
      {/* Daily strategy allowance (scaling nudge) */}
      {rl.isOwnKey ? (
        <Card className="p-3 border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-medium">Unlimited strategies (your own key)</div>
              <div className="text-[10px] text-muted-foreground">No daily cap - you are not using the shared Z.ai pool.</div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-3">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Daily strategy allowance</span>
            </div>
            {!rl.loading && (
              <span className={cn('text-[10px] font-mono font-bold', rlTextColor)}>
                {rl.used} / {rl.limit}
              </span>
            )}
          </div>
          {rl.loading ? (
            <div className="h-2 rounded-full bg-muted animate-pulse" />
          ) : (
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', rlBarColor)}
                style={{ width: `${rlPct}%` }}
              />
            </div>
          )}
          <p className="text-[10px] text-muted-foreground mt-1.5">
            {rl.loading
              ? 'Checking your allowance…'
              : rl.remaining > 0
                ? `${rl.remaining} ${rl.remaining === 1 ? 'strategy' : 'strategies'} left today - shared Z.ai pool, resets daily.`
                : 'Daily limit reached on the shared pool - resets at midnight.'}
          </p>
          {keyCta}
        </Card>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="h-3.5 w-3.5 text-amber-600" />
            <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">API Calls</span>
          </div>
          <div className="text-xl font-bold">{summary.totalCalls}</div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <BarChart3 className="h-3.5 w-3.5 text-amber-600" />
            <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Est. Tokens</span>
          </div>
          <div className="text-xl font-bold">{summary.totalTokens > 1000 ? `${(summary.totalTokens / 1000).toFixed(1)}K` : summary.totalTokens}</div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Est. Cost</span>
          </div>
          <div className="text-xl font-bold">{summary.totalCost > 0 ? `$${summary.totalCost.toFixed(2)}` : 'Free'}</div>
        </Card>
      </div>

      {/* 7-day chart */}
      {summary.totalCalls > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-amber-600" /> Last 7 days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1.5 h-20">
              {summary.last7Days.map((day) => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-amber-500/70 rounded-t-sm transition-all" style={{ height: `${(day.calls / maxDailyCalls) * 100}%`, minHeight: day.calls > 0 ? '4px' : '0' }} />
                  <span className="text-[8px] font-mono text-muted-foreground">{day.date.slice(5)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* By provider */}
      {Object.keys(summary.byProvider).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono">By Provider</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {Object.entries(summary.byProvider).map(([provider, data]) => (
              <div key={provider} className="flex items-center justify-between text-xs">
                <span className="font-mono">{provider}</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">{data.calls} calls</span>
                  <span className="text-muted-foreground">{data.tokens > 1000 ? `${(data.tokens / 1000).toFixed(1)}K` : data.tokens} tokens</span>
                  <span className={cn('font-mono font-bold', data.cost > 0 ? 'text-amber-600' : 'text-emerald-600')}>
                    {data.cost > 0 ? `$${data.cost.toFixed(2)}` : 'Free'}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* By engine */}
      {Object.keys(summary.byEngine).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono">By Engine</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {Object.entries(summary.byEngine).sort((a, b) => b[1].calls - a[1].calls).map(([engine, data]) => (
              <div key={engine} className="flex items-center justify-between text-xs">
                <span className="font-mono capitalize">{engine}</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">{data.calls} calls</span>
                  <span className="text-muted-foreground">{data.tokens > 1000 ? `${(data.tokens / 1000).toFixed(1)}K` : data.tokens} tokens</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Optimization tips */}
      {tips.length > 0 && (
        <Card className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border-amber-500/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-bold">Optimization Tips</span>
          </div>
          <ul className="space-y-1.5">
            {tips.map((tip, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <span className="text-amber-600 mt-0.5">-</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Clear */}
      {summary.totalCalls > 0 && (
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-red-500" onClick={handleClear}>
          <Trash2 className="h-3 w-3" /> Clear usage data
        </Button>
      )}
    </div>
  )
}
