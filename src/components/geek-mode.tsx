'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, RotateCcw, Check, ChevronDown, ChevronRight, Cpu, Zap, Sliders,
  Database, Plus, Trash2, Edit3, Code2, RefreshCw, X, Eye, GitBranch, CheckCircle2, Copy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { EnginePipeline, type EngineState, type EngineStatus } from '@/components/engine-pipeline'
import { Timeline } from '@/components/timeline'
import { ENGINE_DEFS, type EngineId, type TimelineEvent } from '@/lib/types'
import { socialImpactPackMeta, EXAMPLE_PROBLEMS } from '@/lib/social-impact-pack'
import { socialImpactPack } from '@/lib/knowledge'
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

export interface GeekConfig {
  maxIterations: number
  qualityThreshold: number
  temperature: number
  timeout: number
}

const DEFAULT_CONFIG: GeekConfig = {
  maxIterations: 2,
  qualityThreshold: 80,
  temperature: 0.7,
  timeout: 90,
}

export function GeekMode({ connected, providerConfig }: { connected: boolean; providerConfig: ProviderConfig }) {
  const [problem, setProblem] = useState('')
  const [running, setRunning] = useState(false)
  const [statuses, setStatuses] = useState<Record<EngineId, EngineStatus>>(emptyStatuses())
  const [activeEngine, setActiveEngine] = useState<EngineId | null>(null)
  const [currentIteration, setCurrentIteration] = useState(0)
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [finalRecord, setFinalRecord] = useState<any>(null)
  const [memory, setMemory] = useState<any[]>(([])
  )
  const [error, setError] = useState<string | null>(null)
  const [packInfo] = useState({ name: socialImpactPackMeta.name, domain: socialImpactPackMeta.domain, maxIterations: MAX_ITERATIONS, threshold: 80 })
  const [config, setConfig] = useState<GeekConfig>(DEFAULT_CONFIG)
  const [showConfig, setShowConfig] = useState(false)
  const [showInspector, setShowInspector] = useState(false)
  const [inspectorData, setInspectorData] = useState<{ engine: string; input: any; output: any } | null>(null)
  const [engineOutputs, setEngineOutputs] = useState<Record<string, any>>({})
  const [activeTab, setActiveTab] = useState('pipeline')

  const eventCounter = useRef(0)
  const timelineEndRef = useRef<HTMLDivElement>(null)
  const runStateRef = useRef<any>({})

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

  const storeOutput = (engine: string, output: any) => {
    setEngineOutputs((prev) => ({ ...prev, [engine]: output }))
  }

  const handleRun = useCallback(async () => {
    if (running || !problem.trim()) return
    const loopSessionId = `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setAnalyticsSession(loopSessionId)
    const loopStart = Date.now()

    setStatuses(emptyStatuses()); setActiveEngine(null); setCurrentIteration(0)
    setEvents([]); setFinalRecord(null); setError(null)
    setEngineOutputs({})
    setRunning(true)
    const outputTypes = ['strategy'] as any[]

    analytics.runStart({ problemLength: problem.trim().length, outputTypes, provider: providerConfig.provider, skippedInterview: true })

    try {
      // Supervisor
      setActiveEngine('supervisor'); setEngineState('supervisor', 'running')
      pushEvent({ type: 'engine:start', engine: 'supervisor', title: 'supervisor start' })
      const interviewResult = await callInterview(problem.trim(), providerConfig)
      const decomposition = interviewResult.decomposition
      storeOutput('supervisor', decomposition)
      setEngineState('supervisor', 'done'); setActiveEngine(null)
      pushEvent({ type: 'engine:done', engine: 'supervisor', title: 'supervisor done', payload: { output: decomposition } })

      // Retrieval
      setActiveEngine('retrieval'); setEngineState('retrieval', 'running')
      pushEvent({ type: 'engine:start', engine: 'retrieval', title: 'retrieval start' })
      const retrievalResult = await callRetrieval(problem.trim(), decomposition)
      const retrieval = retrievalResult.output
      storeOutput('retrieval', retrieval)
      setEngineState('retrieval', 'done'); setActiveEngine(null)
      pushEvent({ type: 'engine:done', engine: 'retrieval', title: 'retrieval done', payload: { output: retrieval } })

      let priorDraft: string | null = null
      let priorCritique: string | null = null
      let finalDraft = ''
      let finalScore = 0
      let thresholdMet = false
      let iterations = 0
      const trace: any[] = []

      for (let iter = 1; iter <= config.maxIterations; iter++) {
        setCurrentIteration(iter)
        const traceEntry: any = { iteration: iter }

        // Rule
        setActiveEngine('rule'); setEngineState('rule', 'running', iter)
        pushEvent({ type: 'engine:start', engine: 'rule', iteration: iter, title: `rule start iter ${iter}` })
        const ruleChecks = await callRuleChecks(problem.trim())
        traceEntry.ruleChecks = ruleChecks
        storeOutput(`rule-${iter}`, ruleChecks)
        setEngineState('rule', 'done', iter); setActiveEngine(null)
        pushEvent({ type: 'engine:done', engine: 'rule', iteration: iter, title: `rule done iter ${iter}`, payload: { output: ruleChecks } })

        // Reasoning
        setActiveEngine('reasoning'); setEngineState('reasoning', 'running', iter)
        pushEvent({ type: 'engine:start', engine: 'reasoning', iteration: iter, title: `reasoning start iter ${iter}` })
        const draft = await callReasoning({
          problem: problem.trim(), decomposition, retrieval,
          priorCritique, priorDraft, iteration: iter, maxIterations: config.maxIterations,
          outputTypes, answers: {}, providerConfig,
        })
        traceEntry.draft = draft
        storeOutput(`reasoning-${iter}`, draft)
        setEngineState('reasoning', 'done', iter); setActiveEngine(null)
        pushEvent({ type: 'engine:done', engine: 'reasoning', iteration: iter, title: `reasoning done iter ${iter}`, payload: { output: draft } })

        // Critique
        setActiveEngine('critique'); setEngineState('critique', 'running', iter)
        pushEvent({ type: 'engine:start', engine: 'critique', iteration: iter, title: `critique start iter ${iter}` })
        const critique = await callCritique(draft, providerConfig)
        traceEntry.critique = critique
        storeOutput(`critique-${iter}`, critique)
        priorCritique = critique.issues.map((i: any) => `[${i.severity}] (${i.heuristic}) ${i.description}`).join('\n')
        setEngineState('critique', 'done', iter); setActiveEngine(null)
        pushEvent({ type: 'engine:done', engine: 'critique', iteration: iter, title: `critique done iter ${iter}`, payload: { output: critique } })

        // Improvement
        setActiveEngine('improvement'); setEngineState('improvement', 'running', iter)
        pushEvent({ type: 'engine:start', engine: 'improvement', iteration: iter, title: `improvement start iter ${iter}` })
        const improved = await callImprovement(draft, critique, providerConfig)
        traceEntry.improved = improved
        storeOutput(`improvement-${iter}`, improved)
        setEngineState('improvement', 'done', iter); setActiveEngine(null)
        pushEvent({ type: 'engine:done', engine: 'improvement', iteration: iter, title: `improvement done iter ${iter}`, payload: { output: improved } })

        // Evaluation
        setActiveEngine('evaluation'); setEngineState('evaluation', 'running', iter)
        pushEvent({ type: 'engine:start', engine: 'evaluation', iteration: iter, title: `evaluation start iter ${iter}` })
        const evaluation = await callEvaluation(improved, providerConfig, config.qualityThreshold)
        traceEntry.evaluation = evaluation
        storeOutput(`evaluation-${iter}`, evaluation)
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
        storeOutput('structure', structured)
        pushEvent({ type: 'engine:done', engine: 'memory', title: 'structure done', payload: { output: structured } })
      }

      const record = {
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
  }, [running, problem, providerConfig, pushEvent, config])

  const handleReset = useCallback(() => {
    setStatuses(emptyStatuses()); setActiveEngine(null); setCurrentIteration(0)
    setEvents([]); setFinalRecord(null); setError(null)
    setEngineOutputs({})
  }, [])

  const handleClearMemory = useCallback(() => { clearMemory().then(() => setMemory([])).catch(() => {}) }, [])
  const loadExample = useCallback((p: string) => setProblem(p), [])

  const openInspector = (engine: string) => {
    const output = engineOutputs[engine]
    if (output) {
      setInspectorData({ engine, input: null, output })
      setShowInspector(true)
    }
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pipeline" className="text-xs gap-1.5"><Cpu className="h-3.5 w-3.5" /> Pipeline</TabsTrigger>
          <TabsTrigger value="config" className="text-xs gap-1.5"><Sliders className="h-3.5 w-3.5" /> Config</TabsTrigger>
          <TabsTrigger value="inspector" className="text-xs gap-1.5"><Code2 className="h-3.5 w-3.5" /> Data</TabsTrigger>
          <TabsTrigger value="knowledge" className="text-xs gap-1.5"><Database className="h-3.5 w-3.5" /> Knowledge</TabsTrigger>
        </TabsList>

        {/* PIPELINE TAB */}
        <TabsContent value="pipeline" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <Cpu className="h-4 w-4 text-amber-600" /> problem input
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="Describe the decision problem..." className="min-h-[100px] resize-y font-mono text-sm" disabled={running} />
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={handleRun} disabled={running || !problem.trim()} className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
                  {running ? <><Play className="h-4 w-4" /> Running...</> : <><Play className="h-4 w-4" /> Run reasoning loop</>}
                </Button>
                <Button variant="ghost" onClick={handleReset} disabled={running} className="gap-2"><RotateCcw className="h-4 w-4" /> Reset</Button>
                {/* Config quick toggle */}
                <Button variant="outline" size="sm" className="gap-1.5 text-xs ml-auto" onClick={() => setActiveTab('config')}>
                  <Sliders className="h-3.5 w-3.5" /> {config.maxIterations}x / {config.qualityThreshold}pt
                </Button>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                <span>examples:</span>
                {EXAMPLE_PROBLEMS.map((ex) => (
                  <button key={ex.label} type="button" onClick={() => loadExample(ex.problem)} disabled={running}
                    className="px-1.5 py-0.5 rounded border border-border hover:border-amber-500 transition-colors">{ex.label}</button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Engine Pipeline */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-mono flex items-center gap-2"><Cpu className="h-4 w-4 text-amber-600" /> engine pipeline</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-[10px] gap-1"><Zap className="h-3 w-3" /> threshold: {config.qualityThreshold}</Badge>
                  <Badge variant="outline" className="text-[10px]">max iter: {config.maxIterations}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <EnginePipeline statuses={statuses} activeEngine={activeEngine} currentIteration={currentIteration} maxIterations={config.maxIterations} />
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono text-muted-foreground">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> running</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> done</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> error</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted" /> idle</span>
                <span className="ml-auto text-amber-600">click any engine output in timeline to inspect raw data</span>
              </div>
            </CardContent>
          </Card>

          {/* Timeline with click-to-inspect */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-amber-600" /> reasoning trace
                <span className="text-muted-foreground font-normal">- {events.length} events</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-3">
                <div className="space-y-1.5">
                  {events.map((ev) => (
                    <div key={ev.id} className={cn(
                      'rounded-md border px-3 py-2 text-xs cursor-pointer transition-all',
                      ev.type === 'engine:done' ? 'border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20' : '',
                      ev.type === 'engine:start' ? 'border-amber-500/20 opacity-60' : '',
                      ev.type === 'loop:error' ? 'border-red-500/40 bg-red-50/30' : '',
                      ev.type === 'loop:complete' ? 'border-emerald-500/40 bg-emerald-50/30' : '',
                    )} onClick={() => {
                      if (ev.type === 'engine:done' && ev.payload?.output) {
                        setInspectorData({ engine: ev.engine || 'unknown', input: null, output: ev.payload.output })
                        setActiveTab('inspector')
                      }
                    }}>
                      <div className="flex items-center gap-2">
                        {ev.type === 'engine:done' && <Check className="h-3 w-3 text-emerald-500" />}
                        {ev.type === 'engine:start' && <RefreshCw className="h-3 w-3 text-amber-500 animate-spin" />}
                        {ev.type === 'loop:error' && <X className="h-3 w-3 text-red-500" />}
                        {ev.type === 'loop:complete' && <Check className="h-3 w-3 text-emerald-600" />}
                        <span className="font-mono">{ev.engine || ev.type}</span>
                        {ev.iteration && <span className="text-muted-foreground">iter {ev.iteration}</span>}
                        {ev.type === 'engine:done' && ev.payload?.output && (
                          <span className="ml-auto text-[9px] text-amber-600 flex items-center gap-0.5">
                            <Eye className="h-2.5 w-2.5" /> inspect
                          </span>
                        )}
                      </div>
                      {ev.type === 'engine:done' && ev.payload?.output && typeof ev.payload.output === 'string' && (
                        <div className="mt-1 text-[10px] text-muted-foreground line-clamp-2 font-mono">{ev.payload.output.slice(0, 120)}...</div>
                      )}
                      {ev.type === 'engine:done' && ev.payload?.output && typeof ev.payload.output === 'object' && (
                        <div className="mt-1 text-[10px] text-muted-foreground font-mono">
                          {Array.isArray(ev.payload.output) ? `${ev.payload.output.length} items` : Object.keys(ev.payload.output).length > 0 ? `${Object.keys(ev.payload.output).length} fields` : 'empty'}
                        </div>
                      )}
                    </div>
                  ))}
                  {events.length === 0 && <div className="text-xs text-muted-foreground font-mono py-6 text-center">No events yet. Run a problem to see the trace.</div>}
                </div>
                <div ref={timelineEndRef} />
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Error display */}
          {error && (
            <Card className="p-4 border-red-500/40 bg-red-50/30">
              <div className="flex items-center gap-2 text-xs text-red-600">
                <X className="h-4 w-4" />
                <span className="font-mono font-bold">ERROR</span>
              </div>
              <p className="mt-1 text-xs text-red-700 dark:text-red-300 font-mono break-words">{error}</p>
            </Card>
          )}

          {/* Final output */}
          {finalRecord && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-mono flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> final output
                  <span className="text-muted-foreground font-normal">- score {finalRecord.finalScore}/100</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <pre className="text-[10px] font-mono whitespace-pre-wrap break-words">{finalRecord.finalDraft}</pre>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* CONFIG TAB */}
        <TabsContent value="config" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <Sliders className="h-4 w-4 text-amber-600" /> engine configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Max iterations */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Max iterations (reasoning loop)</Label>
                  <Badge variant="outline" className="font-mono text-xs">{config.maxIterations}</Badge>
                </div>
                <Slider value={[config.maxIterations]} min={1} max={5} step={1}
                  onValueChange={(v) => setConfig({ ...config, maxIterations: v[0] })} />
                <p className="text-[10px] text-muted-foreground">How many times the reasoning loop runs if quality is below threshold. More iterations = better quality but slower.</p>
              </div>

              {/* Quality threshold */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Quality threshold (0-100)</Label>
                  <Badge variant="outline" className="font-mono text-xs">{config.qualityThreshold}</Badge>
                </div>
                <Slider value={[config.qualityThreshold]} min={50} max={100} step={5}
                  onValueChange={(v) => setConfig({ ...config, qualityThreshold: v[0] })} />
                <p className="text-[10px] text-muted-foreground">Minimum quality score to deliver output. Below this, the loop repeats (up to max iterations).</p>
              </div>

              {/* Temperature */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Temperature (creativity)</Label>
                  <Badge variant="outline" className="font-mono text-xs">{config.temperature.toFixed(1)}</Badge>
                </div>
                <Slider value={[config.temperature * 10]} min={0} max={15} step={1}
                  onValueChange={(v) => setConfig({ ...config, temperature: v[0] / 10 })} />
                <p className="text-[10px] text-muted-foreground">0 = deterministic, 1.5 = very creative. Lower is better for M&E; higher for brainstorming.</p>
              </div>

              {/* Timeout */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">LLM timeout (seconds)</Label>
                  <Badge variant="outline" className="font-mono text-xs">{config.timeout}s</Badge>
                </div>
                <Slider value={[config.timeout]} min={30} max={180} step={15}
                  onValueChange={(v) => setConfig({ ...config, timeout: v[0] })} />
                <p className="text-[10px] text-muted-foreground">How long to wait for each LLM call before timing out. Increase if using slow models.</p>
              </div>

              <Separator />

              {/* Provider info */}
              <div className="space-y-1">
                <Label className="text-xs">Active AI provider</Label>
                <div className="text-xs font-mono text-muted-foreground">{providerConfig.provider}</div>
              </div>

              {/* Reset config */}
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setConfig(DEFAULT_CONFIG)}>
                <RotateCcw className="h-3 w-3" /> Reset to defaults
              </Button>
            </CardContent>
          </Card>

          {/* Per-engine output speeds */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-mono">Engine outputs (from last run)</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(engineOutputs).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Run a problem to see engine outputs here.</p>
              ) : (
                <div className="space-y-1.5">
                  {Object.entries(engineOutputs).map(([key, value]) => (
                    <button key={key} onClick={() => { setInspectorData({ engine: key, input: null, output: value }); setActiveTab('inspector') }}
                      className="w-full flex items-center justify-between text-xs px-3 py-2 rounded-md border border-border hover:border-amber-500 transition-colors">
                      <span className="font-mono">{key}</span>
                      <span className="text-muted-foreground flex items-center gap-1">
                        {typeof value === 'string' ? `${value.length} chars` : typeof value === 'object' ? `${Array.isArray(value) ? value.length : Object.keys(value).length} items` : 'N/A'}
                        <Eye className="h-3 w-3" />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DATA INSPECTOR TAB */}
        <TabsContent value="inspector" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <Code2 className="h-4 w-4 text-amber-600" /> raw data inspector
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!inspectorData ? (
                <p className="text-xs text-muted-foreground text-center py-8">
                  Click any engine output in the Pipeline tab to inspect its raw data here.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-mono text-xs">{inspectorData.engine}</Badge>
                    <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => {
                      navigator.clipboard?.writeText(JSON.stringify(inspectorData.output, null, 2))
                    }}>
                      <Copy className="h-3 w-3" /> Copy JSON
                    </Button>
                  </div>
                  <ScrollArea className="h-[500px]">
                    <pre className="text-[10px] font-mono whitespace-pre-wrap break-words p-3 bg-muted/30 rounded-md">
                      {JSON.stringify(inspectorData.output, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* KNOWLEDGE PACK TAB */}
        <TabsContent value="knowledge" className="space-y-4 mt-4">
          <KnowledgePackEditor />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============================================================
// Knowledge Pack Editor
// ============================================================
function KnowledgePackEditor() {
  const [section, setSection] = useState<'frameworks' | 'rules' | 'evidence' | 'memory' | 'patterns' | 'heuristics'>('frameworks')

  const sections = [
    { id: 'frameworks' as const, label: 'Frameworks', count: socialImpactPack.frameworks.length, items: socialImpactPack.frameworks.map(f => ({ name: f.name, desc: f.description })) },
    { id: 'rules' as const, label: 'Decision Rules', count: socialImpactPack.decisionRules.length, items: socialImpactPack.decisionRules.map(r => ({ name: r.name, desc: r.check })) },
    { id: 'evidence' as const, label: 'Evidence', count: socialImpactPack.evidence.length, items: socialImpactPack.evidence.map(e => ({ name: e.title, desc: e.summary })) },
    { id: 'memory' as const, label: 'Historical Memory', count: socialImpactPack.historicalMemory.length, items: socialImpactPack.historicalMemory.map(m => ({ name: m.problem, desc: m.lesson })) },
    { id: 'patterns' as const, label: 'Reasoning Patterns', count: socialImpactPack.reasoningPatterns.length, items: socialImpactPack.reasoningPatterns.map(p => ({ name: p.name, desc: p.description })) },
    { id: 'heuristics' as const, label: 'Improvement Heuristics', count: socialImpactPack.improvementHeuristics.length, items: socialImpactPack.improvementHeuristics.map(h => ({ name: h.name, desc: h.description })) },
  ]

  const current = sections.find(s => s.id === section)!

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            <Database className="h-4 w-4 text-amber-600" /> knowledge pack editor
          </CardTitle>
          <p className="text-xs text-muted-foreground">View and inspect the Social Impact Pack knowledge graph. Each layer feeds the reasoning engines.</p>
        </CardHeader>
        <CardContent>
          {/* Section tabs */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {sections.map((s) => (
              <button key={s.id} onClick={() => setSection(s.id)}
                className={cn('px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1.5',
                  section === s.id ? 'bg-amber-500 text-white' : 'bg-muted hover:bg-muted/70')}>
                {s.label} <span className="opacity-60">({s.count})</span>
              </button>
            ))}
          </div>

          {/* Items */}
          <ScrollArea className="h-[400px] pr-2">
            <div className="space-y-2">
              {current.items.map((item, i) => (
                <div key={i} className="rounded-md border border-border p-3 group hover:border-amber-500/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{item.name}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{item.desc}</div>
                    </div>
                    <Badge variant="outline" className="text-[9px] font-mono shrink-0">#{i + 1}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Info */}
          <div className="mt-3 p-3 rounded-md bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/30">
            <p className="text-[10px] text-muted-foreground">
              <strong className="text-amber-700 dark:text-amber-400">Read-only in beta.</strong> Full editing (add/edit/delete items, create custom packs, import/export as JSON) coming soon. The knowledge pack is defined in <code className="bg-muted px-1 rounded">src/lib/knowledge.ts</code>.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
