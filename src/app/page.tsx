'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BrainCircuit, Play, Square, RotateCcw, History, Trash2, ChevronDown, ChevronRight,
  FileText, Sparkles, Database, ShieldCheck, AlertCircle, CheckCircle2, Layers,
  GitBranch, BookOpen, Cpu, Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { EnginePipeline, type EngineState, type EngineStatus } from '@/components/engine-pipeline'
import { Timeline } from '@/components/timeline'
import {
  ENGINE_DEFS,
  type EngineId,
  type TimelineEvent,
  type MemoryRecord,
  type Decomposition,
  type RetrievalResult,
  type RuleCheckResult,
  type CritiqueResult,
  type EvaluationResult,
} from '@/lib/types'
import { socialImpactPackMeta, EXAMPLE_PROBLEMS } from '@/lib/social-impact-pack'
import { cn } from '@/lib/utils'

const MAX_ITERATIONS = 2 // mirror mini-service default

function emptyStatuses(): Record<EngineId, EngineStatus> {
  const out = {} as Record<EngineId, EngineStatus>
  for (const e of ENGINE_DEFS) {
    out[e.id] = { state: 'idle', iterations: [] }
  }
  return out
}

export default function Home() {
  const [problem, setProblem] = useState('')
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [running, setRunning] = useState(false)
  const [statuses, setStatuses] = useState<Record<EngineId, EngineStatus>>(emptyStatuses())
  const [activeEngine, setActiveEngine] = useState<EngineId | null>(null)
  const [currentIteration, setCurrentIteration] = useState(0)
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [finalRecord, setFinalRecord] = useState<MemoryRecord | null>(null)
  const [memory, setMemory] = useState<MemoryRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [packInfo, setPackInfo] = useState<{ name: string; domain: string; maxIterations: number; threshold: number } | null>(null)
  const eventCounter = useRef(0)
  const sessionIdRef = useRef<string>('')
  const timelineEndRef = useRef<HTMLDivElement>(null)

  const pushEvent = useCallback((ev: Omit<TimelineEvent, 'id' | 'ts'>) => {
    eventCounter.current += 1
    const full: TimelineEvent = { id: `ev-${eventCounter.current}`, ts: Date.now(), ...ev }
    setEvents((prev) => [...prev, full])
  }, [])

  // ---------- Socket lifecycle ----------
  useEffect(() => {
    const s = io('/?XTransformPort=3003', {
      path: '/',
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 30000,
    })
    socketRef.current = s

    s.on('connect', () => {
      setConnected(true)
      s.emit('memory:list', {})
    })
    s.on('disconnect', () => setConnected(false))
    s.on('connect_error', () => setConnected(false))

    s.on('memory:list', (data: { memory: MemoryRecord[] }) => {
      setMemory(data.memory ?? [])
    })

    s.on('loop:start', (p: any) => {
      setPackInfo({
        name: p.pack?.name ?? 'Social Impact Pack',
        domain: p.pack?.domain ?? 'Social Impact',
        maxIterations: p.maxIterations ?? MAX_ITERATIONS,
        threshold: p.threshold ?? 80,
      })
      setError(null)
      setFinalRecord(null)
    })

    s.on('engine:start', (p: any) => {
      if (p.sessionId !== sessionIdRef.current) return
      setActiveEngine(p.engine)
      setStatuses((prev) => {
        const next = { ...prev }
        const cur = next[p.engine as EngineId]
        // For engines that run per-iteration, add an iteration slot
        if (p.iteration) {
          const its = [...cur.iterations]
          its.push({ iteration: p.iteration, state: 'running' })
          next[p.engine as EngineId] = { state: 'running', iterations: its }
        } else {
          next[p.engine as EngineId] = { state: 'running', iterations: cur.iterations }
        }
        return next
      })
      pushEvent({
        type: 'engine:start',
        engine: p.engine,
        iteration: p.iteration,
        title: `${p.engine} start${p.iteration ? ` iter ${p.iteration}` : ''}`,
      })
    })

    s.on('engine:done', (p: any) => {
      if (p.sessionId !== sessionIdRef.current) return
      setStatuses((prev) => {
        const next = { ...prev }
        const cur = next[p.engine as EngineId]
        let its = cur.iterations
        if (p.iteration) {
          its = cur.iterations.map((it) =>
            it.iteration === p.iteration ? { ...it, state: 'done' as EngineState } : it
          )
          if (!its.find((it) => it.iteration === p.iteration)) {
            its.push({ iteration: p.iteration, state: 'done' })
          }
        }
        next[p.engine as EngineId] = { state: 'done', iterations: its }
        return next
      })
      // Only clear active engine if this is the last running one
      setActiveEngine((cur) => (cur === p.engine ? null : cur))
      pushEvent({
        type: 'engine:done',
        engine: p.engine,
        iteration: p.iteration,
        title: `${p.engine} done${p.iteration ? ` iter ${p.iteration}` : ''}`,
        payload: { output: p.output },
      })
    })

    s.on('engine:error', (p: any) => {
      if (p.sessionId !== sessionIdRef.current) return
      setStatuses((prev) => {
        const next = { ...prev }
        const cur = next[p.engine as EngineId]
        let its = cur.iterations
        if (p.iteration) {
          its = cur.iterations.map((it) =>
            it.iteration === p.iteration ? { ...it, state: 'error' as EngineState } : it
          )
        }
        next[p.engine as EngineId] = { state: 'error', iterations: its }
        return next
      })
      pushEvent({
        type: 'engine:error',
        engine: p.engine,
        iteration: p.iteration,
        title: `${p.engine} error`,
        payload: { error: p.error },
      })
    })

    s.on('iteration:done', (p: any) => {
      if (p.sessionId !== sessionIdRef.current) return
      setCurrentIteration(p.iteration)
      pushEvent({
        type: 'iteration:done',
        iteration: p.iteration,
        title: `iteration ${p.iteration} done`,
        payload: { qualityScore: p.qualityScore, thresholdMet: p.thresholdMet },
      })
    })

    s.on('loop:complete', (p: any) => {
      if (p.sessionId !== sessionIdRef.current) return
      setRunning(false)
      setActiveEngine(null)
      setFinalRecord(p.record)
      setCurrentIteration(p.record?.iterations ?? 0)
      pushEvent({
        type: 'loop:complete',
        title: 'loop complete',
        payload: { record: p.record },
      })
      s.emit('memory:list', {})
    })

    s.on('loop:error', (p: any) => {
      if (p.sessionId !== sessionIdRef.current) return
      setRunning(false)
      setActiveEngine(null)
      setError(p.error)
      pushEvent({
        type: 'loop:error',
        title: 'loop error',
        payload: { error: p.error },
      })
    })

    return () => {
      s.disconnect()
    }
  }, [])

  // Auto-scroll timeline
  useEffect(() => {
    timelineEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [events])

  const handleRun = useCallback(() => {
    const socket = socketRef.current
    if (!socket || !connected || running || !problem.trim()) return
    const sessionId = `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    sessionIdRef.current = sessionId
    setStatuses(emptyStatuses())
    setActiveEngine(null)
    setCurrentIteration(0)
    setEvents([])
    setFinalRecord(null)
    setError(null)
    setPackInfo(null)
    setRunning(true)
    socket.emit('run', { problem: problem.trim(), sessionId })
  }, [connected, running, problem])

  const handleStop = useCallback(() => {
    // Note: the loop continues server-side; we only stop listening and reset local state.
    const socket = socketRef.current
    if (socket) {
      socket.disconnect()
      setTimeout(() => socket.connect(), 200)
    }
    setRunning(false)
    setActiveEngine(null)
    setError('Run cancelled by user. (Server loop may still complete; refresh memory to see it.)')
  }, [])

  const handleReset = useCallback(() => {
    setStatuses(emptyStatuses())
    setActiveEngine(null)
    setCurrentIteration(0)
    setEvents([])
    setFinalRecord(null)
    setError(null)
    setPackInfo(null)
  }, [])

  const handleClearMemory = useCallback(() => {
    const socket = socketRef.current
    if (socket) {
      socket.emit('memory:clear', {})
    }
  }, [])

  const loadExample = useCallback((p: string) => {
    setProblem(p)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative h-9 w-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
              <BrainCircuit className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-base leading-tight tracking-tight">HubForge OS</div>
              <div className="text-[10px] font-mono text-muted-foreground leading-tight">decision intelligence infrastructure</div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline" className="hidden sm:inline-flex gap-1 font-mono text-[10px]">
              <Layers className="h-3 w-3" /> v0.1 · Apache-2.0
            </Badge>
            <Badge className="gap-1 bg-amber-600 hover:bg-amber-600 text-white">
              <Sparkles className="h-3 w-3" /> {socialImpactPackMeta.name}
            </Badge>
            <ConnectionPill connected={connected} />
          </div>
        </div>
      </header>

      {/* Hero / status strip */}
      <section className="border-b border-border bg-gradient-to-b from-background to-stone-50 dark:to-stone-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Recursive reasoning for social-impact decisions.
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                No output is trusted after first generation. The system retrieves evidence, drafts,
                critiques its own logic, improves, evaluates, stores learning, and repeats until the
                quality threshold is met.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
              <Stat label="engines" value="8" />
              <Stat label="knowledge layers" value="8" />
              <Stat label="frameworks" value={String(socialImpactPackMeta.layers.frameworks)} />
              <Stat label="max iterations" value={String(MAX_ITERATIONS)} />
            </div>
          </div>
        </div>
      </section>

      {/* Main */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        {/* Problem input */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-600" />
              problem input
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="Describe the decision problem you want HubForge OS to reason about…"
              className="min-h-[110px] resize-y font-mono text-sm"
              disabled={running}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleRun} disabled={!connected || running || !problem.trim()} className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
                {running ? <><Square className="h-4 w-4" /> Running…</> : <><Play className="h-4 w-4" /> Run reasoning loop</>}
              </Button>
              {running && (
                <Button variant="outline" onClick={handleStop} className="gap-2">
                  <Square className="h-4 w-4" /> Cancel
                </Button>
              )}
              <Button variant="ghost" onClick={handleReset} disabled={running} className="gap-2">
                <RotateCcw className="h-4 w-4" /> Reset
              </Button>
              <div className="ml-auto hidden sm:flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                <span>examples:</span>
                {EXAMPLE_PROBLEMS.map((ex) => (
                  <button
                    key={ex.label}
                    type="button"
                    onClick={() => loadExample(ex.problem)}
                    disabled={running}
                    className="px-1.5 py-0.5 rounded border border-border hover:border-amber-500 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
            {/* mobile examples */}
            <div className="sm:hidden flex flex-wrap gap-1 text-[10px] font-mono">
              <span className="text-muted-foreground">examples:</span>
              {EXAMPLE_PROBLEMS.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  onClick={() => loadExample(ex.problem)}
                  disabled={running}
                  className="px-1.5 py-0.5 rounded border border-border"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Two-column workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Pipeline + Timeline */}
          <div className="lg:col-span-8 space-y-6">
            {/* Pipeline */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-mono flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-amber-600" />
                    core engine pipeline
                  </CardTitle>
                  {packInfo && (
                    <Badge variant="outline" className="font-mono text-[10px] gap-1">
                      <Zap className="h-3 w-3" /> threshold {packInfo.threshold}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <EnginePipeline
                  statuses={statuses}
                  activeEngine={activeEngine}
                  currentIteration={currentIteration}
                  maxIterations={packInfo?.maxIterations ?? MAX_ITERATIONS}
                />
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> running</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> done</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> error</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted" /> idle</span>
                  <span className="ml-auto">cost hierarchy: deterministic → cheap → expensive</span>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-amber-600" />
                  reasoning trace
                  <span className="text-muted-foreground font-normal">· {events.length} events</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[420px] pr-3">
                  <Timeline events={events} running={running} />
                  <div ref={timelineEndRef} />
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right: Quality / Output / Memory */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quality progression */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  quality progression
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QualityProgress events={events} threshold={packInfo?.threshold ?? 80} />
              </CardContent>
            </Card>

            {/* Final deliverable */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-600" />
                  final deliverable
                </CardTitle>
              </CardHeader>
              <CardContent>
                {finalRecord ? (
                  <FinalDeliverable record={finalRecord} />
                ) : (
                  <div className="text-xs text-muted-foreground font-mono py-6 text-center">
                    The expert-grade output will appear here once the loop completes.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Memory */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-mono flex items-center gap-2">
                    <History className="h-4 w-4 text-amber-600" />
                    institutional memory
                    <span className="text-muted-foreground font-normal">· {memory.length}</span>
                  </CardTitle>
                  {memory.length > 0 && (
                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-[10px] font-mono" onClick={handleClearMemory} disabled={running}>
                      <Trash2 className="h-3 w-3" /> clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <MemoryList memory={memory} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Pack reference */}
        <PackReference />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] font-mono text-muted-foreground">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-3.5 w-3.5 text-amber-600" />
            <span>HubForge OS · open-source decision intelligence infrastructure</span>
          </div>
          <div className="flex items-center gap-3">
            <span>build systems that think better.</span>
            <Badge variant="outline" className="font-mono text-[10px]">Apache-2.0</Badge>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ---------- Sub-components ----------

function ConnectionPill({ connected }: { connected: boolean }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono',
      connected
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
        : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full', connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500')} />
      {connected ? 'engine online' : 'offline'}
    </span>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-base font-bold text-stone-900 dark:text-stone-100 leading-none">{value}</span>
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  )
}

function QualityProgress({ events, threshold }: { events: TimelineEvent[]; threshold: number }) {
  // Collect evaluation 'engine:done' events (have overall score)
  const evaluations = events.filter(
    (e) => e.type === 'engine:done' && e.engine === 'evaluation' && e.payload?.output?.overall != null
  )
  const scores = evaluations.map((e) => ({ iteration: e.iteration ?? 0, score: e.payload.output.overall as number }))

  if (scores.length === 0) {
    return (
      <div className="text-xs text-muted-foreground font-mono py-6 text-center">
        Quality scores will appear as each iteration is evaluated.
      </div>
    )
  }

  const maxScore = 100
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2 h-32">
        {scores.map((s, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="text-xs font-bold font-mono">{s.score}</div>
            <div className="w-full bg-muted rounded-t-md overflow-hidden flex-1 flex items-end relative">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(s.score / maxScore) * 100}%` }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className={cn(
                  'w-full rounded-t-md',
                  s.score >= threshold ? 'bg-emerald-500' : s.score >= 60 ? 'bg-amber-500' : 'bg-red-500'
                )}
              />
              {/* threshold line */}
              <div
                className="absolute left-0 right-0 border-t border-dashed border-stone-400 dark:border-stone-600"
                style={{ bottom: `${(threshold / maxScore) * 100}%` }}
              />
            </div>
            <div className="text-[9px] font-mono text-muted-foreground">iter {s.iteration}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
        <span className="inline-block w-3 border-t border-dashed border-stone-400 dark:border-stone-600" />
        <span>threshold = {threshold}</span>
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
      <div className="max-h-[420px] overflow-y-auto pr-2 text-sm leading-relaxed prose-sm">
        <MarkdownLite text={record.finalDraft} />
      </div>
      <Collapsible open={showTrace} onOpenChange={setShowTrace}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full gap-1 text-[10px] font-mono">
            {showTrace ? <><ChevronDown className="h-3 w-3" /> hide iteration trace</> : <><ChevronRight className="h-3 w-3" /> show iteration trace</>}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-2">
          {record.trace.map((t) => (
            <div key={t.iteration} className="rounded-md border border-border p-2 text-xs font-mono">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px]">iter {t.iteration}</Badge>
                {t.evaluation && <span className="text-muted-foreground">score: {t.evaluation.overall}</span>}
              </div>
              {t.critique && (
                <div className="text-muted-foreground">
                  critique: {t.critique.issues.length} issues ({t.critique.issues.filter(i => i.severity === 'high').length} high)
                </div>
              )}
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

function MemoryList({ memory }: { memory: MemoryRecord[] }) {
  if (memory.length === 0) {
    return (
      <div className="text-xs text-muted-foreground font-mono py-6 text-center">
        No prior reasoning traces. Run a problem to start building institutional memory.
      </div>
    )
  }
  return (
    <ScrollArea className="h-[260px] pr-2">
      <div className="space-y-2">
        {memory.map((m) => (
          <div key={m.id} className="rounded-md border border-border p-2 hover:border-amber-500/50 transition-colors">
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className={cn(
                'text-xs font-mono font-bold',
                m.finalScore >= 80 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
              )}>{m.finalScore}</span>
              <span className="text-[10px] font-mono text-muted-foreground">/ 100 · {m.iterations} iter · {new Date(m.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="text-xs line-clamp-2">{m.problem}</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {m.retrieval.frameworks.slice(0, 3).map((f, i) => (
                <span key={i} className="px-1 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-[9px] font-mono">{f}</span>
              ))}
            </div>
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
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-amber-600" />
                social impact pack — knowledge graph
              </CardTitle>
              <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <KnowledgeLayer
                icon={Layers}
                title="Layer 1 · Domain"
                count={socialImpactPackMeta.supports.length}
                items={socialImpactPackMeta.supports}
              />
              <KnowledgeLayer
                icon={BookOpen}
                title="Layer 2 · Frameworks"
                count={socialImpactPackMeta.layers.frameworks}
                items={socialImpactPackMeta.frameworkNames}
              />
              <KnowledgeLayer
                icon={ShieldCheck}
                title="Layer 4 · Decision Rules"
                count={socialImpactPackMeta.layers.decisionRules}
                items={socialImpactPackMeta.ruleNames}
              />
              <KnowledgeLayer
                icon={Database}
                title="Layer 5 · Evidence"
                count={socialImpactPackMeta.layers.evidence}
                items={['OECD-DAC Criteria', 'Better Evaluation Rainbow', 'Innosight ToC Field Guide', 'World Bank IEG Handbook', 'CGAP Financial Diaries']}
              />
              <KnowledgeLayer
                icon={History}
                title="Layer 6 · Historical Memory"
                count={socialImpactPackMeta.layers.historicalMemory}
                items={['Farmer livelihoods (SSA)', 'Girls’ education (South Asia)', 'Rural healthcare access']}
              />
              <KnowledgeLayer
                icon={GitBranch}
                title="Layer 7 · Reasoning Patterns"
                count={socialImpactPackMeta.layers.reasoningPatterns}
                items={['Root Cause', 'Counterfactual', 'Tradeoff', 'Risk Modelling', 'Comparative', 'Contribution']}
              />
              <KnowledgeLayer
                icon={Sparkles}
                title="Layer 8 · Improvement Heuristics"
                count={socialImpactPackMeta.layers.improvementHeuristics}
                items={['Weak assumptions', 'Missing evidence', 'Vague → measurable', 'Causal logic', 'Inconsistency', 'Reduce uncertainty']}
              />
              <div className="rounded-md border border-border p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="h-3 w-3" /> evaluation rubric
                </div>
                <div className="space-y-1">
                  {socialImpactPackMeta.evaluationCriteria.map((c) => (
                    <div key={c.criterion} className="flex items-baseline gap-2 text-[11px] font-mono">
                      <span className="flex-1 truncate">{c.criterion}</span>
                      <span className="text-muted-foreground">w{c.weight}</span>
                    </div>
                  ))}
                </div>
              </div>
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
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
        <Icon className="h-3 w-3" /> {title}
        <span className="ml-auto text-amber-700 dark:text-amber-400 font-bold">{count}</span>
      </div>
      <div className="space-y-0.5">
        {items.map((it, i) => (
          <div key={i} className="text-[11px] font-mono text-stone-700 dark:text-stone-300 leading-tight">• {it}</div>
        ))}
      </div>
    </div>
  )
}

// Tiny markdown renderer for the final deliverable
function MarkdownLite({ text }: { text: string }) {
  const lines = text.split('\n')
  const blocks: React.ReactNode[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (/^#{1,6}\s/.test(line)) {
      const level = line.match(/^(#{1,6})/)![1].length
      const content = line.replace(/^#{1,6}\s/, '')
      const cls = level <= 2
        ? 'text-base font-bold mt-4 mb-2 text-stone-900 dark:text-stone-100'
        : 'text-sm font-bold mt-3 mb-1 text-stone-800 dark:text-stone-200'
      blocks.push(<div key={i} className={cls}>{renderInlineMd(content)}</div>)
    } else if (/^\s*[-*]\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s/, ''))
        i++
      }
      i--
      blocks.push(<ul key={i} className="list-disc pl-5 space-y-1 my-2">{items.map((it, j) => <li key={j} className="text-sm">{renderInlineMd(it)}</li>)}</ul>)
    } else if (/^\s*\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s/, ''))
        i++
      }
      i--
      blocks.push(<ol key={i} className="list-decimal pl-5 space-y-1 my-2">{items.map((it, j) => <li key={j} className="text-sm">{renderInlineMd(it)}</li>)}</ol>)
    } else if (line.trim() === '') {
      // skip empty
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
    if (candidates.length === 0) {
      parts.push(rest)
      break
    }
    candidates.sort((a, b) => (a.index! - b.index!))
    const next = candidates[0]
    if (next.index! > 0) parts.push(rest.slice(0, next.index!))
    if (next === bold) {
      parts.push(<strong key={key++} className="font-semibold">{bold![1]}</strong>)
    } else {
      parts.push(<code key={key++} className="px-1 py-0.5 rounded bg-muted text-xs font-mono">{code![1]}</code>)
    }
    rest = rest.slice(next.index! + next[0].length)
  }
  return parts
}
