'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Plus, Target, Calendar, Trash2, Activity,
  ArrowUpRight, ArrowDownRight, Circle, AlertCircle, CheckCircle2, Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  getIndicatorsWithStatus, createIndicator, saveIndicator, deleteIndicator,
  addReading, deleteReading, deriveFromLogframe, getMonitoringSummary,
  type Indicator, type IndicatorWithStatus, type RAGStatus, type MonitoringSummary,
} from '@/lib/monitoring'
import { cn } from '@/lib/utils'

interface MonitoringTrackerProps {
  programId: string
  logframe?: any
}

const RAG_CONFIG: Record<RAGStatus, { label: string; color: string; bg: string; icon: any }> = {
  green: { label: 'On track', color: 'text-emerald-600', bg: 'bg-emerald-500', icon: CheckCircle2 },
  amber: { label: 'At risk', color: 'text-amber-600', bg: 'bg-amber-500', icon: Clock },
  red: { label: 'Off track', color: 'text-red-600', bg: 'bg-red-500', icon: AlertCircle },
  gray: { label: 'No data', color: 'text-muted-foreground', bg: 'bg-muted-foreground', icon: Circle },
}

export function MonitoringTracker({ programId, logframe }: MonitoringTrackerProps) {
  // Lazy-init from localStorage so we don't trigger a cascading render in
  // useEffect (react-hooks/set-state-in-effect lint rule).
  const [indicators, setIndicators] = useState<IndicatorWithStatus[]>(() => getIndicatorsWithStatus(programId))
  const [summary, setSummary] = useState<MonitoringSummary | null>(() => getMonitoringSummary(programId))
  const [showAddForm, setShowAddForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const refresh = () => {
    setIndicators(getIndicatorsWithStatus(programId))
    setSummary(getMonitoringSummary(programId))
  }

  const handleDeriveFromLogframe = () => {
    if (!logframe) return
    deriveFromLogframe(programId, logframe)
    refresh()
  }

  const handleDelete = (id: string) => {
    if (!confirm('Delete this indicator and all its readings?')) return
    deleteIndicator(id)
    refresh()
  }

  return (
    <div className="space-y-4">
      {/* Summary header */}
      {summary && summary.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <Card className="p-3">
            <div className="text-[10px] font-mono uppercase text-muted-foreground">Indicators</div>
            <div className="text-xl font-bold">{summary.total}</div>
          </Card>
          <Card className="p-3">
            <div className="text-[10px] font-mono uppercase text-muted-foreground">Avg progress</div>
            <div className="text-xl font-bold text-amber-600">{summary.avgProgress}%</div>
          </Card>
          <Card className="p-3 flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <div>
              <div className="text-[10px] font-mono uppercase text-muted-foreground">On track</div>
              <div className="text-sm font-bold">{summary.green}</div>
            </div>
          </Card>
          <Card className="p-3 flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <div>
              <div className="text-[10px] font-mono uppercase text-muted-foreground">At risk</div>
              <div className="text-sm font-bold">{summary.amber}</div>
            </div>
          </Card>
          <Card className="p-3 flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <div>
              <div className="text-[10px] font-mono uppercase text-muted-foreground">Off track</div>
              <div className="text-sm font-bold">{summary.red}</div>
            </div>
          </Card>
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-3.5 w-3.5" /> Add indicator
        </Button>
        {logframe && (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={handleDeriveFromLogframe}>
            <Target className="h-3.5 w-3.5" /> Derive from logframe
          </Button>
        )}
        {summary && summary.nextActionsDue > 0 && (
          <Badge variant="outline" className="text-[10px] gap-1 border-amber-500/40 text-amber-700 dark:text-amber-300">
            <Clock className="h-3 w-3" /> {summary.nextActionsDue} due soon
          </Badge>
        )}
      </div>

      {/* Add indicator form */}
      {showAddForm && (
        <AddIndicatorForm
          programId={programId}
          onSaved={() => { setShowAddForm(false); refresh() }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Empty state */}
      {indicators.length === 0 && !showAddForm && (
        <Card className="p-8 text-center border-dashed">
          <Activity className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium mb-1">No indicators yet</p>
          <p className="text-xs text-muted-foreground mb-4">
            Track progress against your program's indicators. Add manually or derive from your logframe.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowAddForm(true)}>Add manually</Button>
            {logframe && (
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5" onClick={handleDeriveFromLogframe}>
                <Target className="h-3.5 w-3.5" /> Derive from logframe
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Indicator list */}
      <div className="space-y-2">
        {indicators.map((ind) => (
          <IndicatorCard
            key={ind.id}
            indicator={ind}
            expanded={expandedId === ind.id}
            onToggle={() => setExpandedId(expandedId === ind.id ? null : ind.id)}
            onAddReading={(value, date, note, source) => {
              addReading(ind.id, { value, date, note, source })
              refresh()
            }}
            onDeleteReading={(readingId) => {
              deleteReading(ind.id, readingId)
              refresh()
            }}
            onDelete={() => handleDelete(ind.id)}
          />
        ))}
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────────
// Indicator card with progress bar, RAG status, expandable readings
// ───────────────────────────────────────────────────────────────────────────

function IndicatorCard({
  indicator, expanded, onToggle, onAddReading, onDeleteReading, onDelete,
}: {
  indicator: IndicatorWithStatus
  expanded: boolean
  onToggle: () => void
  onAddReading: (value: number, date: string, note: string, source: string) => void
  onDeleteReading: (readingId: string) => void
  onDelete: () => void
}) {
  const rag = RAG_CONFIG[indicator.status]
  const RagIcon = rag.icon
  const [readingValue, setReadingValue] = useState('')
  const [readingDate, setReadingDate] = useState(new Date().toISOString().slice(0, 10))
  const [readingNote, setReadingNote] = useState('')

  const handleAddReading = () => {
    const val = parseFloat(readingValue)
    if (isNaN(val)) return
    onAddReading(val, readingDate, readingNote, '')
    setReadingValue('')
    setReadingNote('')
  }

  return (
    <Card className="overflow-hidden">
      {/* Header row */}
      <button onClick={onToggle} className="w-full text-left p-3 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-3">
          <div className={cn('h-2.5 w-2.5 rounded-full shrink-0', rag.bg)} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{indicator.title}</div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="text-[8px] h-3.5 px-1">{indicator.level}</Badge>
              {indicator.mov && <span className="truncate">MoV: {indicator.mov}</span>}
            </div>
          </div>
          {/* Progress */}
          <div className="hidden sm:flex flex-col items-end gap-0.5 w-32">
            <div className="text-xs font-mono">
              <span className="font-bold">{indicator.current ?? '-'}</span>
              <span className="text-muted-foreground"> / {indicator.target}</span>
              {indicator.unit && <span className="text-muted-foreground"> {indicator.unit}</span>}
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', rag.bg)}
                style={{ width: `${indicator.progressPercent}%` }}
              />
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs font-bold">{indicator.progressPercent}%</div>
            <div className={cn('text-[9px] flex items-center gap-0.5 justify-end', rag.color)}>
              <RagIcon className="h-2.5 w-2.5" /> {rag.label}
            </div>
          </div>
        </div>
      </button>

      {/* Expanded: readings + add reading form */}
      {expanded && (
        <div className="border-t border-border p-3 space-y-3 bg-muted/10">
          {/* Indicator details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <div className="text-[9px] uppercase text-muted-foreground">Baseline</div>
              <div className="font-mono">{indicator.baseline} {indicator.unit}</div>
            </div>
            <div>
              <div className="text-[9px] uppercase text-muted-foreground">Target</div>
              <div className="font-mono">{indicator.target} {indicator.unit}</div>
            </div>
            <div>
              <div className="text-[9px] uppercase text-muted-foreground">Direction</div>
              <div className="flex items-center gap-0.5">
                {indicator.direction === 'increase'
                  ? <><ArrowUpRight className="h-3 w-3 text-emerald-600" /> Increase</>
                  : <><ArrowDownRight className="h-3 w-3 text-emerald-600" /> Decrease</>}
              </div>
            </div>
            <div>
              <div className="text-[9px] uppercase text-muted-foreground">Frequency</div>
              <div className="capitalize">{indicator.frequency}</div>
            </div>
          </div>

          {/* Add reading form */}
          <div className="rounded-lg border border-border p-2 bg-background space-y-2">
            <div className="text-[10px] font-mono uppercase text-muted-foreground">Add reading</div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="number"
                value={readingValue}
                onChange={(e) => setReadingValue(e.target.value)}
                placeholder="Value"
                className="text-sm h-8 w-full sm:w-24"
              />
              <Input
                type="date"
                value={readingDate}
                onChange={(e) => setReadingDate(e.target.value)}
                className="text-sm h-8 w-full sm:w-36"
              />
              <Input
                value={readingNote}
                onChange={(e) => setReadingNote(e.target.value)}
                placeholder="Note (e.g. Q3 survey)"
                className="text-sm h-8 flex-1"
              />
              <Button size="sm" className="h-8 gap-1" onClick={handleAddReading} disabled={!readingValue}>
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>
          </div>

          {/* Readings history */}
          {indicator.readings.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-mono uppercase text-muted-foreground">Readings ({indicator.readings.length})</div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {[...indicator.readings].reverse().map((r) => (
                  <div key={r.id} className="flex items-center gap-2 text-xs p-1.5 rounded border border-border bg-background">
                    <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="font-mono text-muted-foreground shrink-0">{r.date}</span>
                    <span className="font-bold">{r.value}</span>
                    {indicator.unit && <span className="text-muted-foreground">{indicator.unit}</span>}
                    {r.note && <span className="text-muted-foreground truncate flex-1">- {r.note}</span>}
                    <button onClick={() => onDeleteReading(r.id)} className="text-muted-foreground hover:text-red-500 shrink-0 ml-auto">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-1">
            {indicator.nextDueDate && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Next reading due: {indicator.nextDueDate}
              </span>
            )}
            <Button size="sm" variant="ghost" className="text-red-500 gap-1 ml-auto" onClick={onDelete}>
              <Trash2 className="h-3 w-3" /> Delete indicator
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

// ───────────────────────────────────────────────────────────────────────────
// Add indicator form
// ───────────────────────────────────────────────────────────────────────────

function AddIndicatorForm({ programId, onSaved, onCancel }: {
  programId: string
  onSaved: () => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [level, setLevel] = useState<Indicator['level']>('output')
  const [baseline, setBaseline] = useState('0')
  const [target, setTarget] = useState('100')
  const [unit, setUnit] = useState('')
  const [direction, setDirection] = useState<Indicator['direction']>('increase')
  const [frequency, setFrequency] = useState<Indicator['frequency']>('quarterly')
  const [mov, setMov] = useState('')

  const handleSave = () => {
    if (!title.trim()) return
    const indicator = createIndicator({
      programId,
      title: title.trim(),
      level,
      baseline: parseFloat(baseline) || 0,
      target: parseFloat(target) || 100,
      unit: unit.trim(),
      direction,
      frequency,
      mov: mov.trim(),
    })
    saveIndicator(indicator)
    onSaved()
  }

  return (
    <Card className="p-4 space-y-3 border-amber-500/30">
      <div className="text-sm font-medium">New indicator</div>
      <div className="space-y-1">
        <Label className="text-[10px]">Indicator title *</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Reading levels of 3,000 children improved" className="text-sm h-9" autoFocus />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px]">Level</Label>
          <Select value={level} onValueChange={(v) => setLevel(v as any)}>
            <SelectTrigger className="text-sm h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="goal">Goal</SelectItem>
              <SelectItem value="purpose">Purpose</SelectItem>
              <SelectItem value="output">Output</SelectItem>
              <SelectItem value="activity">Activity</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Baseline</Label>
          <Input type="number" value={baseline} onChange={(e) => setBaseline(e.target.value)} className="text-sm h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Target</Label>
          <Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} className="text-sm h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Unit</Label>
          <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="children, %, $" className="text-sm h-9" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px]">Direction</Label>
          <Select value={direction} onValueChange={(v) => setDirection(v as any)}>
            <SelectTrigger className="text-sm h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="increase"><span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Increase (higher = better)</span></SelectItem>
              <SelectItem value="decrease"><span className="flex items-center gap-1"><TrendingDown className="h-3 w-3" /> Decrease (lower = better)</span></SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Frequency</Label>
          <Select value={frequency} onValueChange={(v) => setFrequency(v as any)}>
            <SelectTrigger className="text-sm h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="annually">Annually</SelectItem>
              <SelectItem value="one-time">One-time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-[10px]">Means of verification (optional)</Label>
        <Input value={mov} onChange={(e) => setMov(e.target.value)} placeholder="e.g. Baseline + endline survey" className="text-sm h-9" />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5" onClick={handleSave} disabled={!title.trim()}>
          <Plus className="h-3.5 w-3.5" /> Add indicator
        </Button>
      </div>
    </Card>
  )
}
