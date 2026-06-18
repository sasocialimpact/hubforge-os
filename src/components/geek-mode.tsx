'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BrainCircuit, Play, RotateCcw, History, Trash2, ChevronDown, ChevronRight,
  FileText, Sparkles, Database, ShieldCheck, CheckCircle2, Layers,
  GitBranch, BookOpen, Cpu, Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { EnginePipeline, type EngineState, type EngineStatus } from '@/components/engine-pipeline'
import { Timeline } from '@/components/timeline'
import { ENGINE_DEFS, type EngineId, type TimelineEvent, type MemoryRecord } from '@/lib/types'
import { socialImpactPackMeta, EXAMPLE_PROBLEMS } from '@/lib/social-impact-pack'
import { cn } from '@/lib/utils'
import type { ProviderConfig } from '@/lib/providers'
import {
  callInterview, callRetrieval, callRuleChecks, callReasoning, callCritique,
  callImprovement, callEvaluation, callStructure, getMemory, clearMemory, saveMemory,
} from '@/lib/api-client'
import { analytics, setAnalyticsSession } from '@/lib/analytics'

const MAX_ITERATIONS = 2

function emptyStatuses(): Record<EngineId, EngineStatus> {
  const out = {} as Record<EngineId, EngineStatus>
  for (const e of ENGINE_DEFS) out[e.id] = { state: 'idle', iterations: [] }
  return out
}

export function GeekMode({ connected, providerConfig }: { connected: boolean; providerConfig: ProviderConfig }) {
  const [problem, setProblem] = useState('')
  const [running, setRunning] = useState(false)
  const [statuses, setStatuses] = useState<Record<EngineId, EngineStatus>>(emptyStatuses())
  const [activeEngine, setActiveEngine] = useState<EngineId | null>(null)
  const [currentIteration, setCurrentIteration] = useState(0)
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [finalRecord, setFinalRecord] = useState<MemoryRecord | null>(null)
  const [memory, setMemory] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [packInfo, setPackInfo] = useState<{ name: string; domain: string; maxIterations: number; threshold: number } | null>(null)
  const eventCounter = useRef(0)
  const timelineEndRef = useRef<HTMLDivElement>(null)

  const pushEvent = useCallback((ev: Omit<TimelineEvent, 'id' | 'ts'>) => {
    eventCounter.current += 1
    setEvents((prev) => [...prev, { id: `ev-${eventCounter.current}`, ts: Date.now(), ...ev }])
  }, [])

  useEffect(() => { timelineEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [events])
  useEffect(() => { getMemory().then((m) => setMemory(m)).catch(() => {}) }, [])

  const setEngineState = (engine: EngineId, state: EngineState, iteration?: number) => {
    setStatuses((prev) => {
      const next = { ...prev }
      const cur = next[engine]
      let its = cur.iterations
      if (iteration) {
        if (state === 'running') its = [...cur.iterations, { iteration, state }]
        else its = cur.iterations.map((it) => it.iteration === iteration ? { ...it, state } : it)
        if (!its.find((it) => it.iteration === iteration)) its.push({ iteration, state })
      }
      next[engine] = { state, iterations: its }
      return next
    })
  }

  const handleRun = useCallback(async () => {
    if (running || !problem.trim()) return
    const loopSessionId = `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setAnalyticsSession(loopSessionId)
    const loopStart = Date.now()

    setStatuses(emptyStatuses()); setActiveEngine(null); setCurrentIteration(0)
    setEvents([]); setFinalRecord(null); setError(null)
    setPackInfo({ name: socialImpactPackMeta.name, domain: socialImpactPackMeta.domain, maxIterations: MAX_ITERATIONS, threshold: 80 })
    setRunning(true)
    const outputTypes = ['strategy'] as any[]

    analytics.runStart({ problemLength: problem.trim().length, outputTypes, provider: providerConfig.provider, skippedInterview: true })

    try {
      // Supervisor
      setActiveEngine('supervisor'); setEngineState('supervisor', 'running')
      pushEvent({ type: 'engine:start', engine: 'supervisor', title: 'supervisor start' })
      const interviewResult = await callInterview(problem.trim(), providerConfig)
      const decomposition = interviewResult.decomposition
      setEngineState('supervisor', 'done'); setActiveEngine(null)
      pushEvent({ type: 'engine:done', engine: 'supervisor', title: 'supervisor done', payload: { output: decomposition } })

      // Retrieval
      setActiveEngine('retrieval'); setEngineState('retrieval', 'running')
      pushEvent({ type: 'engine:start', engine: 'retrieval', title: 'retrieval start' })
      const retrievalResult = await callRetrieval(problem.trim(), decomposition)
      const retrieval = retrievalResult.output
      setEngineState('retrieval', 'done'); setActiveEngine(null)
      pushEvent({ type: 'engine:done', engine: 'retrieval', title: 'retrieval done', payload: { output: retrieval } })

      let priorDraft: string | null = null
      let priorCritique: string | null = null
      let finalDraft = ''
      let finalScore = 0
      let thresholdMet = false
      let iterations = 0
      const trace: any[] = []

      for (let iter = 1; iter <= MAX_ITERATIONS; iter++) {
        setCurrentIteration(iter)
        const traceEntry: any = { iteration }

        // Rule
        setActiveEngine('rule'); setEngineState('rule', 'running', iter)
        pushEvent({ type: 'engine:start', engine: 'rule', iteration: iter, title: `rule start iter ${iter}` })
        const ruleChecks = await callRuleChecks(problem.trim())
        traceEntry.ruleChecks = ruleChecks
        setEngineState('rule', 'done', iter); setActiveEngine(null)
        pushEvent({ type: 'engine:done', engine: 'rule', iteration: iter, title: `rule done iter ${iter}`, payload: { output: ruleChecks } })

        // Reasoning
        setActiveEngine('reasoning'); setEngineState('reasoning', 'running', iter)
        pushEvent({ type: 'engine:start', engine: 'reasoning', iteration: iter, title: `reasoning start iter ${iter}` })
        const draft = await callReasoning({
          problem: problem.trim(), decomposition, retrieval,
          priorCritique, priorDraft, iteration: iter, maxIterations: MAX_ITERATIONS,
          outputTypes, answers: {}, providerConfig,
        })
        traceEntry.draft = draft
        setEngineState('reasoning', 'done', iter); setActiveEngine(null)
        pushEvent({ type: 'engine:done', engine: 'reasoning', iteration: iter, title: `reasoning done iter ${iter}`, payload: { output: draft } })

        // Critique
        setActiveEngine('critique'); setEngineState('critique', 'running', iter)
        pushEvent({ type: 'engine:start', engine: 'critique', iteration: iter, title: `critique start iter ${iter}` })
        const critique = await callCritique(draft, providerConfig)
        traceEntry.critique = critique
        priorCritique = critique.issues.map((i: any) => `[${i.severity}] (${i.heuristic}) ${i.description}`).join('\n')
        setEngineState('critique', 'done', iter); setActiveEngine(null)
        pushEvent({ type: 'engine:done', engine: 'critique', iteration: iter, title: `critique done iter ${iter}`, payload: { output: critique } })

        // Improvement
        setActiveEngine('improvement'); setEngineState('improvement', 'running', iter)
        pushEvent({ type: 'engine:start', engine: 'improvement', iteration: iter, title: `improvement start iter ${iter}` })
        const improved = await callImprovement(draft, critique, providerConfig)
        traceEntry.improved = improved
        setEngineState('improvement', 'done', iter); setActiveEngine(null)
        pushEvent({ type: 'engine:done', engine: 'improvement', iteration: iter, title: `improvement done iter ${iter}`, payload: { output: improved } })

        // Evaluation
        setActiveEngine('evaluation'); setEngineState('evaluation', 'running', iter)
        pushEvent({ type: 'engine:start', engine: 'evaluation', iteration: iter, title: `evaluation start iter ${iter}` })
        const evaluation = await callEvaluation(improved, providerConfig, 80)
        traceEntry.evaluation = evaluation
        setEngineState('evaluation', 'done', iter); setActiveEngine(null)
        pushEvent({ type: 'engine:done', engine: 'evaluation', iteration: iter, title: `evaluation done iter ${iter}`, payload: { output: evaluation } })

        // Memory
        setEngineState('memory', 'running', iter)
        pushEvent({ type: 'engine:start', engine: 'memory', iteration: iter, title: `memory start iter ${iter}` })
        trace.push(traceEntry)
        setEngineState('memory', 'done', iter)
        pushEvent({ type: 'engine:done', engine: 'memory', iteration: iter, title: `memory done iter ${iter}` })

        finalDraft = improved; finalScore = evaluation.overall; thresholdMet = evaluation.thresholdMet; iterations = iter
        priorDraft = improved
        pushEvent({ type: 'iteration:done', iteration: iter, title: `iteration ${iter} done`, payload: { qualityScore: evaluation.overall, thresholdMet: evaluation.thresholdMet } })
        if (evaluation.thresholdMet) break
      }

      // Structure
      let structured: any = {}
      if (outputTypes.includes('toc') || outputTypes.includes('logframe')) {
        setActiveEngine('memory')
        pushEvent({ type: 'engine:start', engine: 'memory', title: 'structure start' })
        structured = await callStructure(finalDraft, outputTypes, providerConfig)
        pushEvent({ type: 'engine:done', engine: 'memory', title: 'structure done', payload: { output: structured } })
      }

      const record: MemoryRecord = {
        id: `${loopSessionId}-${Date.now()}`, timestamp: new Date().toISOString(),
        problem: problem.trim(), iterations, finalScore, thresholdMet,
        decomposition, retrieval: { frameworks: retrieval.frameworks.map((f: any) => f.name), rules: [], evidence: [] },
        trace, finalDraft, outputTypes, provider: providerConfig.provider, structuredOutputs: structured,
      }

      setFinalRecord(record); setRunning(false); setActiveEngine(null)
      pushEvent({ type: 'loop:complete', title: 'loop complete', payload: { record } })
      analytics.runComplete({ finalScore, iterations, thresholdMet }, Date.now() - loopStart)
      saveMemory(record).catch(() => {})
      getMemory().then((m) => setMemory(m)).catch(() => {})
    } catch (e: any) {
      console.error('Loop error:', e)
      analytics.runError({ error: e?.message ?? 'unknown', phase: 'unknown' })
      setRunning(false); setActiveEngine(null); setError(e?.message ?? String(e))
      pushEvent({ type: 'loop:error', title: 'loop error', payload: { error: e?.message } })
    }
  }, [running, problem, providerConfig, pushEvent])

  const handleReset = useCallback(() => {
    setStatuses(emptyStatuses()); setActiveEngine(null); setCurrentIteration(0)
    setEvents([]); setFinalRecord(null); setError(null); setPackInfo(null)
  }, [])

  const handleClearMemory = useCallback(() => { clearMemory().then(() => setMemory([])).catch(() => {}) }, [])
  const loadExample = useCallback((p: string) => setProblem(p), [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2"><FileText className="h-4 w-4 text-amber-600" /> problem input</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="Describe the decision problem you want HubForge OS to reason about…" className="min-h-[110px] resize-y font-mono text-sm" disabled={running} />
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleRun} disabled={running || !problem.trim()} className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
              {running ? <><Play className="h-4 w-4" /> Running…</> : <><Play className="h-4 w-4" /> Run reasoning loop</>}
            </Button>
            <Button variant="ghost" onClick={handleReset} disabled={running} className="gap-2"><RotateCcw className="h-4 w-4" /> Reset</Button>
            <div className="ml-auto hidden sm:flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
              <span>examples:</span>
              {EXAMPLE_PROBLEMS.map((ex) => (<button key={ex.label} type="button" onClick={() => loadExample(ex.problem)} disabled={running} className="px-1.5 py-0.5 rounded border border-border hover:border-amber-500 hover:text-amber-700 dark:hover:text-amber-300 transition-colors">{ex.label}</button>))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-mono flex items-center gap-2"><Cpu className="h-4 w-4 text-amber-600" /> core engine pipeline</CardTitle>
                {packInfo && <Badge variant="outline" className="font-mono text-[10px] gap-1"><Zap className="h-3 w-3" /> threshold {packInfo.threshold}</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <EnginePipeline statuses={statuses} activeEngine={activeEngine} currentIteration={currentIteration} maxIterations={packInfo?.maxIterations ?? MAX_ITERATIONS} />
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono text-muted-foreground">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> running</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> done</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> error</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted" /> idle</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-mono flex items-center gap-2"><GitBranch className="h-4 w-4 text-amber-600" /> reasoning trace <span className="text-muted-foreground font-normal">· {events.length} events</span></CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[420px] pr-3"><Timeline events={events} running={running} /><div ref={timelineEndRef} /></ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-mono flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-amber-600" /> quality progression</CardTitle></CardHeader>
            <CardContent><QualityProgress events={events} threshold={packInfo?.threshold ?? 80} /></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-mono flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-amber-600" /> final deliverable</CardTitle></CardHeader>
            <CardContent>{finalRecord ? <FinalDeliverable record={finalRecord} /> : <div className="text-xs text-muted-foreground font-mono py-6 text-center">The expert-grade output will appear here once the loop completes.</div>}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-mono flex items-center gap-2"><History className="h-4 w-4 text-amber-600" /> institutional memory <span className="text-muted-foreground font-normal">· {memory.length}</span></CardTitle>
                {memory.length > 0 && <Button variant="ghost" size="sm" className="h-7 gap-1 text-[10px] font-mono" onClick={handleClearMemory} disabled={running}><Trash2 className="h-3 w-3" /> clear</Button>}
              </div>
            </CardHeader>
            <CardContent><MemoryList memory={memory} /></CardContent>
          </Card>
        </div>
      </div>
      <PackReference />
    </div>
  )
}

function QualityProgress({ events, threshold }: { events: TimelineEvent[]; threshold: number }) {
  const evaluations = events.filter((e) => e.type === 'engine:done' && e.engine === 'evaluation' && e.payload?.output?.overall != null)
  const scores = evaluations.map((e) => ({ iteration: e.iteration ?? 0, score: e.payload.output.overall as number }))
  if (scores.length === 0) return <div className="text-xs text-muted-foreground font-mono py-6 text-center">Quality scores will appear as each iteration is evaluated.</div>
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2 h-32">
        {scores.map((s, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="text-xs font-bold font-mono">{s.score}</div>
            <div className="w-full bg-muted rounded-t-md overflow-hidden flex-1 flex items-end relative">
              <motion.div initial={{ height: 0 }} animate={{ height: `${s.score}%` }} transition={{ duration: 0.6, delay: i * 0.1 }} className={cn('w-full rounded-t-md', s.score >= threshold ? 'bg-emerald-500' : s.score >= 60 ? 'bg-amber-500' : 'bg-red-500')} />
              <div className="absolute left-0 right-0 border-t border-dashed border-stone-400 dark:border-stone-600" style={{ bottom: `${threshold}%` }} />
            </div>
            <div className="text-[9px] font-mono text-muted-foreground">iter {s.iteration}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FinalDeliverable({ record }: { record: MemoryRecord }) {
  const [showTrace, setShowTrace] = useState(false)
  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">{record.finalScore}</span>
        <span className="text-xs font-mono text-muted-foreground">/ 100 · {record.iterations} iteration{record.iterations === 1 ? '' : 's'} · {record.thresholdMet ? 'delivered' : 'flagged for review'}</span>
      </div>
      <Separator />
      <div className="max-h-[420px] overflow-y-auto pr-2 text-sm leading-relaxed"><MarkdownLite text={record.finalDraft} /></div>
      <Collapsible open={showTrace} onOpenChange={setShowTrace}>
        <CollapsibleTrigger asChild><Button variant="ghost" size="sm" className="w-full gap-1 text-[10px] font-mono">{showTrace ? <><ChevronDown className="h-3 w-3" /> hide trace</> : <><ChevronRight className="h-3 w-3" /> show trace</>}</Button></CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-2">
          {record.trace.map((t) => (
            <div key={t.iteration} className="rounded-md border border-border p-2 text-xs font-mono">
              <div className="flex items-center gap-2 mb-1"><Badge variant="outline" className="text-[10px]">iter {t.iteration}</Badge>{t.evaluation && <span className="text-muted-foreground">score: {t.evaluation.overall}</span>}</div>
              {t.critique && <div className="text-muted-foreground">critique: {t.critique.issues.length} issues</div>}
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

function MemoryList({ memory }: { memory: any[] }) {
  if (memory.length === 0) return <div className="text-xs text-muted-foreground font-mono py-6 text-center">No prior sessions.</div>
  return (
    <ScrollArea className="h-[260px] pr-2">
      <div className="space-y-2">
        {memory.map((m) => (
          <div key={m.id} className="rounded-md border border-border p-2 hover:border-amber-500/50 transition-colors">
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className={cn('text-xs font-mono font-bold', (m.final_score ?? m.finalScore) >= 80 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400')}>{m.final_score ?? m.finalScore}</span>
              <span className="text-[10px] font-mono text-muted-foreground">/ 100 · {(m.iterations) || 0} iter</span>
            </div>
            <div className="text-xs line-clamp-2">{m.problem}</div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

function PackReference() {
  const [open, setOpen] = useState(false)
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-mono flex items-center gap-2"><BookOpen className="h-4 w-4 text-amber-600" /> social impact pack — knowledge graph</CardTitle>
              <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <KnowledgeLayer icon={Layers} title="Layer 1 · Domain" count={socialImpactPackMeta.supports.length} items={socialImpactPackMeta.supports} />
              <KnowledgeLayer icon={BookOpen} title="Layer 2 · Frameworks" count={socialImpactPackMeta.layers.frameworks} items={socialImpactPackMeta.frameworkNames} />
              <KnowledgeLayer icon={ShieldCheck} title="Layer 4 · Decision Rules" count={socialImpactPackMeta.layers.decisionRules} items={socialImpactPackMeta.ruleNames} />
              <KnowledgeLayer icon={Database} title="Layer 5 · Evidence" count={socialImpactPackMeta.layers.evidence} items={['OECD-DAC', 'Better Evaluation', 'Innosight ToC', 'World Bank IEG', 'CGAP']} />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

function KnowledgeLayer({ icon: Icon, title, count, items }: { icon: any; title: string; count: number; items: string[] }) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><Icon className="h-3 w-3" /> {title}<span className="ml-auto text-amber-700 dark:text-amber-400 font-bold">{count}</span></div>
      <div className="space-y-0.5">{items.map((it, i) => (<div key={i} className="text-[11px] font-mono text-stone-700 dark:text-stone-300 leading-tight">• {it}</div>))}</div>
    </div>
  )
}

function MarkdownLite({ text }: { text: string }) {
  const lines = text.split('\n')
  const blocks: React.ReactNode[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (/^#{1,6}\s/.test(line)) {
      const level = line.match(/^(#{1,6})/)![1].length
      const content = line.replace(/^#{1,6}\s/, '')
      const cls = level <= 2 ? 'text-base font-bold mt-4 mb-2 text-stone-900 dark:text-stone-100' : 'text-sm font-bold mt-3 mb-1 text-stone-800 dark:text-stone-200'
      blocks.push(<div key={i} className={cls}>{renderInlineMd(content)}</div>)
    } else if (/^\s*[-*]\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*]\s/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*]\s/, '')); i++ }
      i--
      blocks.push(<ul key={i} className="list-disc pl-5 space-y-1 my-2">{items.map((it, j) => <li key={j} className="text-sm">{renderInlineMd(it)}</li>)}</ul>)
    } else if (/^\s*\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*\d+\.\s/.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+\.\s/, '')); i++ }
      i--
      blocks.push(<ol key={i} className="list-decimal pl-5 space-y-1 my-2">{items.map((it, j) => <li key={j} className="text-sm">{renderInlineMd(it)}</li>)}</ol>)
    } else if (line.trim() === '') {
    } else {
      blocks.push(<p key={i} className="text-sm my-1.5 leading-relaxed">{renderInlineMd(line)}</p>)
    }
    i++
  }
  return <>{blocks}</>
}

function renderInlineMd(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let rest = text
  let key = 0
  while (rest.length > 0) {
    const bold = rest.match(/\*\*(.+?)\*\*/)
    const code = rest.match(/`(.+?)`/)
    const candidates = [bold, code].filter(Boolean) as RegExpMatchArray[]
    if (candidates.length === 0) { parts.push(rest); break }
    candidates.sort((a, b) => (a.index! - b.index!))
    const next = candidates[0]
    if (next.index! > 0) parts.push(rest.slice(0, next.index!))
    if (next === bold) parts.push(<strong key={key++} className="font-semibold">{bold![1]}</strong>)
    else parts.push(<code key={key++} className="px-1 py-0.5 rounded bg-muted text-xs font-mono">{code![1]}</code>)
    rest = rest.slice(next.index! + next[0].length)
  }
  return parts
}
