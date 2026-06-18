'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Brain, ShieldCheck, Search, Wand2, Gauge, Library, Database, Workflow, Loader2 } from 'lucide-react'
import * as Icons from 'lucide-react'
import { ENGINE_DEFS, type TimelineEvent, type EngineId } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useState, ReactNode } from 'react'

const ICON_MAP: Record<EngineId, any> = {
  supervisor: Workflow,
  retrieval: Database,
  rule: ShieldCheck,
  reasoning: Brain,
  critique: Search,
  improvement: Wand2,
  evaluation: Gauge,
  memory: Library,
}

interface TimelineProps {
  events: TimelineEvent[]
  running: boolean
}

export function Timeline({ events, running }: TimelineProps) {
  return (
    <div className="space-y-2">
      <AnimatePresence initial={false} mode="popLayout">
        {events.map((ev) => (
          <TimelineRow key={ev.id} event={ev} />
        ))}
      </AnimatePresence>
      {running && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-2"
        >
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="font-mono">reasoning…</span>
        </motion.div>
      )}
      {events.length === 0 && !running && (
        <div className="text-xs text-muted-foreground px-3 py-8 text-center font-mono">
          Awaiting problem input. The reasoning trace will stream here as each engine runs.
        </div>
      )}
    </div>
  )
}

function TimelineRow({ event }: { event: TimelineEvent }) {
  const [expanded, setExpanded] = useState(false)
  const def = event.engine ? ENGINE_DEFS.find((e) => e.id === event.engine) : null
  const Icon = def ? ICON_MAP[def.id] : null

  const isStart = event.type === 'engine:start'
  const isDone = event.type === 'engine:done'
  const isError = event.type === 'engine:error'
  const isIteration = event.type === 'iteration:done'
  const isLoopComplete = event.type === 'loop:complete'
  const isLoopError = event.type === 'loop:error'

  // For 'engine:start' rows we render a compact "spinning" marker that will be
  // visually replaced by the 'engine:done' row once it arrives.
  if (isStart) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 0.55, x: 0 }}
        exit={{ opacity: 0, height: 0 }}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono"
      >
        <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
        <span className="text-amber-600 dark:text-amber-400">
          {def?.name ?? event.engine}
          {event.iteration ? ` · iter ${event.iteration}` : ''}
        </span>
        <span className="text-muted-foreground">— running…</span>
      </motion.div>
    )
  }

  if (isLoopError) {
    return (
      <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-3 py-2 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900">
        <div className="flex items-center gap-2 text-xs font-mono text-red-700 dark:text-red-300">
          <Icons.AlertTriangle className="h-3.5 w-3.5" />
          <span>LOOP ERROR</span>
        </div>
        <div className="mt-1 text-xs text-red-800 dark:text-red-200 font-mono break-words">
          {String(event.payload?.error ?? event.title)}
        </div>
      </motion.div>
    )
  }

  if (isLoopComplete) {
    const r = event.payload?.record
    return (
      <motion.div layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="px-3 py-2 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 dark:text-emerald-300">
          <Icons.CheckCircle2 className="h-3.5 w-3.5" />
          <span>LOOP COMPLETE · delivered in {r?.iterations ?? '?'} iteration{r?.iterations === 1 ? '' : 's'}</span>
        </div>
        {r && (
          <div className="mt-1 text-xs text-emerald-800 dark:text-emerald-200 font-mono">
            final quality score: <strong>{r.finalScore}/100</strong> · threshold {r.thresholdMet ? 'met' : 'not met'} · escalation: {r.thresholdMet ? 'none' : 'flagged for human review'}
          </div>
        )}
      </motion.div>
    )
  }

  if (isIteration) {
    return (
      <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-muted-foreground">
        <Icons.RefreshCw className="h-3 w-3" />
        <span>iteration {event.iteration} complete · quality {event.payload?.qualityScore ?? '?'}/100 {event.payload?.thresholdMet ? '· threshold met' : '· below threshold'}</span>
      </motion.div>
    )
  }

  if (isError) {
    return (
      <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-3 py-2 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900">
        <div className="flex items-center gap-2 text-xs font-mono text-red-700 dark:text-red-300">
          <Icons.AlertTriangle className="h-3.5 w-3.5" />
          <span>{def?.name ?? event.engine} ERROR {event.iteration ? `· iter ${event.iteration}` : ''}</span>
        </div>
        <div className="mt-1 text-xs text-red-800 dark:text-red-200 font-mono break-words">
          {String(event.payload?.error ?? '')}
        </div>
      </motion.div>
    )
  }

  // engine:done row — the meat of the timeline
  const output = event.payload?.output
  const hasOutput = output !== undefined && output !== null
  const preview = renderPreview(event.engine!, output)
  const expandable = hasOutput && preview !== null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      className={cn(
        'rounded-md border bg-card px-3 py-2',
        isDone && 'border-emerald-500/40'
      )}
    >
      <button
        type="button"
        disabled={!expandable}
        onClick={() => setExpanded((s) => !s)}
        className={cn('flex w-full items-start gap-2 text-left', expandable && 'cursor-pointer')}
      >
        {Icon && <Icon className="h-3.5 w-3.5 mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-emerald-700 dark:text-emerald-300">{def?.name ?? event.engine}</span>
            {event.iteration && <span className="text-muted-foreground">· iter {event.iteration}</span>}
            {expandable && (
              <ChevronRight className={cn('h-3 w-3 ml-auto transition-transform', expanded && 'rotate-90')} />
            )}
          </div>
          {preview && !expanded && (
            <div className="mt-1 text-xs text-muted-foreground line-clamp-3 font-mono whitespace-pre-wrap break-words">
              {preview}
            </div>
          )}
        </div>
      </button>
      {expanded && expandable && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 overflow-hidden">
          <ExpandedOutput engine={event.engine!} output={output} />
        </motion.div>
      )}
    </motion.div>
  )
}

function renderPreview(engine: EngineId, output: any): string | null {
  if (output === undefined || output === null) return null
  try {
    switch (engine) {
      case 'supervisor': {
        const d = output
        return `Problem: ${d.problemStatement ?? ''}\nObjectives: ${(d.objectives ?? []).join('; ')}\nScope: ${d.scope ?? ''}`
      }
      case 'retrieval': {
        const r = output
        return `Frameworks: ${(r.frameworks ?? []).map((f: any) => f.name ?? f).join(', ')}\nRules: ${(r.decisionRules ?? []).join(', ')}\nEvidence: ${(r.evidence ?? []).map((e: any) => e.title ?? e).slice(0, 3).join(', ')}`
      }
      case 'rule': {
        const arr: any[] = Array.isArray(output) ? output : []
        const passed = arr.filter((r) => r.passed).length
        return `${arr.length} rule checks · ${passed} passed · ${arr.length - passed} flagged`
      }
      case 'reasoning':
      case 'improvement': {
        const s = String(output)
        return s.slice(0, 240) + (s.length > 240 ? ' …' : '')
      }
      case 'critique': {
        const c = output
        const issues: any[] = c.issues ?? []
        return `${issues.length} issue(s) · ${issues.filter((i: any) => i.severity === 'high').length} high · ${issues.filter((i: any) => i.severity === 'medium').length} medium\n${c.summary ?? ''}`
      }
      case 'evaluation': {
        const e = output
        return `Overall: ${e.overall}/100 · ${e.thresholdMet ? 'THRESHOLD MET' : 'below threshold'}\n${(e.scores ?? []).map((s: any) => `  ${s.criterion}: ${s.score}`).join('\n')}`
      }
      case 'memory':
        return null
      default:
        return null
    }
  } catch {
    return null
  }
}

function ExpandedOutput({ engine, output }: { engine: EngineId; output: any }): ReactNode {
  switch (engine) {
    case 'supervisor':
      return <DecompositionView d={output} />
    case 'retrieval':
      return <RetrievalView r={output} />
    case 'rule':
      return <RuleView checks={Array.isArray(output) ? output : []} />
    case 'reasoning':
    case 'improvement':
      return <MarkdownBlock text={String(output)} />
    case 'critique':
      return <CritiqueView c={output} />
    case 'evaluation':
      return <EvaluationView e={output} />
    default:
      return <pre className="text-xs font-mono whitespace-pre-wrap break-words">{JSON.stringify(output, null, 2)}</pre>
  }
}

function DecompositionView({ d }: { d: any }) {
  return (
    <div className="space-y-2 text-xs font-mono">
      <Field label="Problem">{d.problemStatement}</Field>
      <Field label="Objectives">
        <ul className="list-disc pl-4 space-y-0.5">
          {(d.objectives ?? []).map((o: string, i: number) => <li key={i}>{o}</li>)}
        </ul>
      </Field>
      <Field label="Scope">{d.scope}</Field>
      <Field label="Stakeholders">
        <ul className="space-y-0.5">
          {(d.stakeholders ?? []).map((s: any, i: number) => (
            <li key={i}><strong>{s.role}</strong> — {s.description}</li>
          ))}
        </ul>
      </Field>
      <Field label="Key considerations">
        <ul className="list-disc pl-4 space-y-0.5">
          {(d.keyConsiderations ?? []).map((k: string, i: number) => <li key={i}>{k}</li>)}
        </ul>
      </Field>
      <Field label="Suggested frameworks">
        <div className="flex flex-wrap gap-1">
          {(d.suggestedFrameworks ?? []).map((f: string, i: number) => (
            <span key={i} className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 text-[10px]">{f}</span>
          ))}
        </div>
      </Field>
    </div>
  )
}

function RetrievalView({ r }: { r: any }) {
  return (
    <div className="space-y-2 text-xs font-mono">
      <Field label={`Frameworks (${(r.frameworks ?? []).length})`}>
        <ul className="space-y-0.5">
          {(r.frameworks ?? []).map((f: any, i: number) => (
            <li key={i}><strong>{f.name}</strong> — {f.description}</li>
          ))}
        </ul>
      </Field>
      <Field label={`Decision Rules (${(r.decisionRules ?? []).length})`}>
        <div className="flex flex-wrap gap-1">
          {(r.decisionRules ?? []).map((s: string, i: number) => (
            <span key={i} className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 text-[10px]">{s}</span>
          ))}
        </div>
      </Field>
      <Field label={`Evidence (${(r.evidence ?? []).length})`}>
        <ul className="space-y-0.5">
          {(r.evidence ?? []).map((e: any, i: number) => (
            <li key={i}><strong>{e.title}</strong> <span className="text-muted-foreground">({e.type})</span></li>
          ))}
        </ul>
      </Field>
      <Field label={`Historical Memory (${(r.historicalMemory ?? []).length})`}>
        <ul className="space-y-0.5">
          {(r.historicalMemory ?? []).map((p: string, i: number) => <li key={i}>• {p}</li>)}
        </ul>
      </Field>
      <Field label={`Reasoning Patterns (${(r.reasoningPatterns ?? []).length})`}>
        <div className="flex flex-wrap gap-1">
          {(r.reasoningPatterns ?? []).map((s: string, i: number) => (
            <span key={i} className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 text-[10px]">{s}</span>
          ))}
        </div>
      </Field>
      <Field label={`Improvement Heuristics (${(r.improvementHeuristics ?? []).length})`}>
        <div className="flex flex-wrap gap-1">
          {(r.improvementHeuristics ?? []).map((s: string, i: number) => (
            <span key={i} className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 text-[10px]">{s}</span>
          ))}
        </div>
      </Field>
    </div>
  )
}

function RuleView({ checks }: { checks: any[] }) {
  return (
    <div className="space-y-1 text-xs font-mono">
      {checks.map((c, i) => (
        <div key={i} className="flex items-start gap-2">
          {c.passed ? <Icons.Check className="h-3 w-3 mt-0.5 text-emerald-600" /> : <Icons.AlertTriangle className="h-3 w-3 mt-0.5 text-amber-600" />}
          <div>
            <div><strong>{c.rule}</strong></div>
            <div className="text-muted-foreground">{c.note}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function CritiqueView({ c }: { c: any }) {
  const issues: any[] = c.issues ?? []
  return (
    <div className="space-y-2 text-xs font-mono">
      <div className="text-muted-foreground">{c.summary}</div>
      <div className="space-y-1.5">
        {issues.map((issue, i) => (
          <div key={i} className="flex items-start gap-2 p-1.5 rounded bg-stone-50 dark:bg-stone-900">
            <SeverityBadge severity={issue.severity} />
            <div className="flex-1 min-w-0">
              <div className="text-stone-700 dark:text-stone-200"><strong>{issue.heuristic}</strong></div>
              <div className="text-muted-foreground whitespace-pre-wrap break-words">{issue.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const cls = severity === 'high'
    ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
    : severity === 'medium'
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
      : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'
  return <span className={cn('px-1.5 py-0.5 rounded text-[10px] uppercase font-bold shrink-0', cls)}>{severity}</span>
}

function EvaluationView({ e }: { e: any }) {
  const scores: any[] = e.scores ?? []
  return (
    <div className="space-y-2 text-xs font-mono">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{e.overall}</span>
        <span className="text-muted-foreground">/ 100 overall</span>
        {e.thresholdMet
          ? <span className="ml-auto px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] uppercase font-bold">Threshold Met</span>
          : <span className="ml-auto px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 text-[10px] uppercase font-bold">Below Threshold</span>}
      </div>
      <div className="space-y-1.5">
        {scores.map((s, i) => (
          <div key={i} className="space-y-0.5">
            <div className="flex items-baseline gap-2">
              <span className="flex-1 truncate">{s.criterion}</span>
              <span className="text-muted-foreground">w{s.weight}</span>
              <span className="font-bold w-8 text-right">{s.score}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${s.score}%` }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
                className={cn(
                  'h-full rounded-full',
                  s.score >= 80 ? 'bg-emerald-500' : s.score >= 60 ? 'bg-amber-500' : 'bg-red-500'
                )}
              />
            </div>
            <div className="text-[10px] text-muted-foreground">{s.rationale}</div>
          </div>
        ))}
      </div>
      {e.notes && <div className="text-muted-foreground pt-1 border-t border-border">{e.notes}</div>}
    </div>
  )
}

function MarkdownBlock({ text }: { text: string }) {
  // Lightweight markdown render: headings, bold, lists, paragraphs, code spans.
  const lines = text.split('\n')
  const blocks: ReactNode[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (/^#{1,6}\s/.test(line)) {
      const level = line.match(/^(#{1,6})/)![1].length
      const content = line.replace(/^#{1,6}\s/, '')
      const cls = level <= 2 ? 'text-sm font-bold mt-3 mb-1' : 'text-xs font-bold mt-2 mb-1'
      blocks.push(<div key={i} className={cls}>{renderInline(content)}</div>)
    } else if (/^\s*[-*]\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s/, ''))
        i++
      }
      i--
      blocks.push(
        <ul key={i} className="list-disc pl-4 space-y-0.5 my-1">
          {items.map((it, j) => <li key={j}>{renderInline(it)}</li>)}
        </ul>
      )
    } else if (/^\s*\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s/, ''))
        i++
      }
      i--
      blocks.push(
        <ol key={i} className="list-decimal pl-4 space-y-0.5 my-1">
          {items.map((it, j) => <li key={j}>{renderInline(it)}</li>)}
        </ol>
      )
    } else if (line.trim() === '') {
      // skip
    } else {
      blocks.push(<p key={i} className="my-1 leading-relaxed">{renderInline(line)}</p>)
    }
    i++
  }
  return <div className="text-xs leading-relaxed prose-sm max-w-none">{blocks}</div>
}

function renderInline(text: string): ReactNode {
  // **bold** and `code`
  const parts: ReactNode[] = []
  let rest = text
  let key = 0
  while (rest.length > 0) {
    const bold = rest.match(/\*\*(.+?)\*\*/)
    const code = rest.match(/`(.+?)`/)
    const next = [bold, code].filter(Boolean).sort((a, b) => (a!.index! - b!.index!))[0]
    if (!next) {
      parts.push(rest)
      break
    }
    if (next.index! > 0) parts.push(rest.slice(0, next.index!))
    if (next === bold) {
      parts.push(<strong key={key++} className="font-semibold">{bold![1]}</strong>)
    } else {
      parts.push(<code key={key++} className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">{code![1]}</code>)
    }
    rest = rest.slice(next.index! + next[0].length)
  }
  return parts
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{label}</div>
      <div className="text-stone-800 dark:text-stone-200">{children}</div>
    </div>
  )
}
