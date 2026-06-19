'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  Play, RotateCcw, Check, Cpu, Zap, Sliders, Database, Code2, RefreshCw, X, Eye,
  GitBranch, CheckCircle2, Copy, Plus, Trash2, Edit3, Download, Upload, GitCompare,
  FileText, ChevronRight, AlertCircle, Clock, DollarSign,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EnginePipeline, type EngineState, type EngineStatus } from '@/components/engine-pipeline'
import { ENGINE_DEFS, type EngineId, type TimelineEvent } from '@/lib/types'
import { socialImpactPackMeta, EXAMPLE_PROBLEMS } from '@/lib/social-impact-pack'
import { socialImpactPack } from '@/lib/knowledge'
import { PROVIDERS, type ProviderConfig, type ProviderId, getStoredProviderConfig } from '@/lib/providers'
import { cn } from '@/lib/utils'
import {
  callInterview, callRetrieval, callRuleChecks, callReasoning, callCritique,
  callImprovement, callEvaluation, callStructure, getMemory, clearMemory, saveMemory,
} from '@/lib/api-client'
import { analytics, setAnalyticsSession } from '@/lib/analytics'

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
  maxIterations: 2, qualityThreshold: 80, temperature: 0.7, timeout: 90,
}

// Engines that use LLM (can have per-engine provider)
const LLM_ENGINES = ['supervisor', 'reasoning', 'critique', 'improvement', 'evaluation', 'structure'] as const
type LLMEngine = typeof LLM_ENGINES[number]

export function GeekMode({ connected, providerConfig }: { connected: boolean; providerConfig: ProviderConfig }) {
  const [problem, setProblem] = useState('')
  const [running, setRunning] = useState(false)
  const [statuses, setStatuses] = useState<Record<EngineId, EngineStatus>>(emptyStatuses())
  const [activeEngine, setActiveEngine] = useState<EngineId | null>(null)
  const [currentIteration, setCurrentIteration] = useState(0)
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [finalRecord, setFinalRecord] = useState<any>(null)
  const [memory, setMemory] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState<GeekConfig>(DEFAULT_CONFIG)
  const [activeTab, setActiveTab] = useState('pipeline')
  const [inspectorData, setInspectorData] = useState<{ engine: string; output: any } | null>(null)
  const [engineOutputs, setEngineOutputs] = useState<Record<string, any>>({})
  // Per-engine provider overrides (null = use default providerConfig)
  const [engineProviders, setEngineProviders] = useState<Record<LLMEngine, ProviderId | null>>(
    () => Object.fromEntries(LLM_ENGINES.map(e => [e, null])) as Record<LLMEngine, ProviderId | null>
  )
  const [comparisons, setComparisons] = useState<{ provider: string; result: any; duration: number; score: number; error?: string }[]>([])

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

  const storeOutput = (engine: string, output: any) => {
    setEngineOutputs((prev) => ({ ...prev, [engine]: output }))
  }

  // Get provider config for a specific engine (uses override or falls back to default)
  const getProviderForEngine = (engine: LLMEngine): ProviderConfig => {
    const override = engineProviders[engine]
    if (!override) return providerConfig
    if (override === 'zai') return { provider: 'zai' }
    const meta = PROVIDERS.find(p => p.id === override)!
    return { provider: override, apiKey: providerConfig.apiKey, baseUrl: meta.defaultBaseUrl, model: meta.defaultModel }
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
      const supConfig = getProviderForEngine('supervisor')
      setActiveEngine('supervisor'); setEngineState('supervisor', 'running')
      pushEvent({ type: 'engine:start', engine: 'supervisor', title: 'supervisor start' })
      const interviewResult = await callInterview(problem.trim(), supConfig)
      const decomposition = interviewResult.decomposition
      storeOutput('supervisor', decomposition)
      setEngineState('supervisor', 'done'); setActiveEngine(null)
      pushEvent({ type: 'engine:done', engine: 'supervisor', title: 'supervisor done', payload: { output: decomposition } })

      setActiveEngine('retrieval'); setEngineState('retrieval', 'running')
      pushEvent({ type: 'engine:start', engine: 'retrieval', title: 'retrieval start' })
      const retrievalResult = await callRetrieval(problem.trim(), decomposition)
      const retrieval = retrievalResult.output
      storeOutput('retrieval', retrieval)
      setEngineState('retrieval', 'done'); setActiveEngine(null)
      pushEvent({ type: 'engine:done', engine: 'retrieval', title: 'retrieval done', payload: { output: retrieval } })

      let priorDraft: string | null = null
      let priorCritique: string | null = null
      let finalDraft = '', finalScore = 0, thresholdMet = false, iterations = 0
      const trace: any[] = []

      for (let iter = 1; iter <= config.maxIterations; iter++) {
        setCurrentIteration(iter)
        const traceEntry: any = { iteration: iter }

        setActiveEngine('rule'); setEngineState('rule', 'running', iter)
        pushEvent({ type: 'engine:start', engine: 'rule', iteration: iter, title: `rule start iter ${iter}` })
        const ruleChecks = await callRuleChecks(problem.trim())
        traceEntry.ruleChecks = ruleChecks; storeOutput(`rule-${iter}`, ruleChecks)
        setEngineState('rule', 'done', iter); setActiveEngine(null)
        pushEvent({ type: 'engine:done', engine: 'rule', iteration: iter, title: `rule done iter ${iter}`, payload: { output: ruleChecks } })

        const reasonConfig = getProviderForEngine('reasoning')
        setActiveEngine('reasoning'); setEngineState('reasoning', 'running', iter)
        pushEvent({ type: 'engine:start', engine: 'reasoning', iteration: iter, title: `reasoning start iter ${iter}` })
        const draft = await callReasoning({ problem: problem.trim(), decomposition, retrieval, priorCritique, priorDraft, iteration: iter, maxIterations: config.maxIterations, outputTypes, answers: {}, providerConfig: reasonConfig })
        traceEntry.draft = draft; storeOutput(`reasoning-${iter}`, draft)
        setEngineState('reasoning', 'done', iter); setActiveEngine(null)
        pushEvent({ type: 'engine:done', engine: 'reasoning', iteration: iter, title: `reasoning done iter ${iter}`, payload: { output: draft } })

        const critConfig = getProviderForEngine('critique')
        setActiveEngine('critique'); setEngineState('critique', 'running', iter)
        pushEvent({ type: 'engine:start', engine: 'critique', iteration: iter, title: `critique start iter ${iter}` })
        const critique = await callCritique(draft, critConfig)
        traceEntry.critique = critique; storeOutput(`critique-${iter}`, critique)
        priorCritique = critique.issues.map((i: any) => `[${i.severity}] (${i.heuristic}) ${i.description}`).join('\n')
        setEngineState('critique', 'done', iter); setActiveEngine(null)
        pushEvent({ type: 'engine:done', engine: 'critique', iteration: iter, title: `critique done iter ${iter}`, payload: { output: critique } })

        const impConfig = getProviderForEngine('improvement')
        setActiveEngine('improvement'); setEngineState('improvement', 'running', iter)
        pushEvent({ type: 'engine:start', engine: 'improvement', iteration: iter, title: `improvement start iter ${iter}` })
        const improved = await callImprovement(draft, critique, impConfig)
        traceEntry.improved = improved; storeOutput(`improvement-${iter}`, improved)
        setEngineState('improvement', 'done', iter); setActiveEngine(null)
        pushEvent({ type: 'engine:done', engine: 'improvement', iteration: iter, title: `improvement done iter ${iter}`, payload: { output: improved } })

        const evalConfig = getProviderForEngine('evaluation')
        setActiveEngine('evaluation'); setEngineState('evaluation', 'running', iter)
        pushEvent({ type: 'engine:start', engine: 'evaluation', iteration: iter, title: `evaluation start iter ${iter}` })
        const evaluation = await callEvaluation(improved, evalConfig, config.qualityThreshold)
        traceEntry.evaluation = evaluation; storeOutput(`evaluation-${iter}`, evaluation)
        setEngineState('evaluation', 'done', iter); setActiveEngine(null)
        pushEvent({ type: 'engine:done', engine: 'evaluation', iteration: iter, title: `evaluation done iter ${iter}`, payload: { output: evaluation } })

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

      let structured: any = {}
      if (outputTypes.includes('toc') || outputTypes.includes('logframe')) {
        const structConfig = getProviderForEngine('structure')
        setActiveEngine('memory')
        pushEvent({ type: 'engine:start', engine: 'memory', title: 'structure start' })
        structured = await callStructure(finalDraft, outputTypes, structConfig)
        storeOutput('structure', structured)
        pushEvent({ type: 'engine:done', engine: 'memory', title: 'structure done', payload: { output: structured } })
      }

      const record = { id: `${loopSessionId}-${Date.now()}`, timestamp: new Date().toISOString(), problem: problem.trim(), iterations, finalScore, thresholdMet, decomposition, retrieval: { frameworks: retrieval.frameworks.map((f: any) => f.name) }, trace, finalDraft, outputTypes, provider: providerConfig.provider, structuredOutputs: structured }
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
  }, [running, problem, providerConfig, pushEvent, config, engineProviders, getProviderForEngine])

  const handleReset = useCallback(() => {
    setStatuses(emptyStatuses()); setActiveEngine(null); setCurrentIteration(0)
    setEvents([]); setFinalRecord(null); setError(null); setEngineOutputs({})
  }, [])

  const loadExample = useCallback((p: string) => setProblem(p), [])

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="pipeline" className="text-xs gap-1.5"><Cpu className="h-3.5 w-3.5" /> Pipeline</TabsTrigger>
          <TabsTrigger value="config" className="text-xs gap-1.5"><Sliders className="h-3.5 w-3.5" /> Config</TabsTrigger>
          <TabsTrigger value="compare" className="text-xs gap-1.5"><GitCompare className="h-3.5 w-3.5" /> Compare</TabsTrigger>
          <TabsTrigger value="prompts" className="text-xs gap-1.5"><FileText className="h-3.5 w-3.5" /> Prompts</TabsTrigger>
          <TabsTrigger value="knowledge" className="text-xs gap-1.5"><Database className="h-3.5 w-3.5" /> Knowledge</TabsTrigger>
          <TabsTrigger value="data" className="text-xs gap-1.5"><Code2 className="h-3.5 w-3.5" /> Data</TabsTrigger>
        </TabsList>

        {/* PIPELINE TAB */}
        <TabsContent value="pipeline" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-mono flex items-center gap-2"><Cpu className="h-4 w-4 text-amber-600" /> problem input</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="Describe the decision problem..." className="min-h-[100px] resize-y font-mono text-sm" disabled={running} />
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={handleRun} disabled={running || !problem.trim()} className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
                  {running ? <><Play className="h-4 w-4" /> Running...</> : <><Play className="h-4 w-4" /> Run reasoning loop</>}
                </Button>
                <Button variant="ghost" onClick={handleReset} disabled={running} className="gap-2"><RotateCcw className="h-4 w-4" /> Reset</Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs ml-auto" onClick={() => setActiveTab('config')}>
                  <Sliders className="h-3.5 w-3.5" /> {config.maxIterations}x / {config.qualityThreshold}pt
                </Button>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                <span>examples:</span>
                {EXAMPLE_PROBLEMS.map((ex) => (<button key={ex.label} type="button" onClick={() => loadExample(ex.problem)} disabled={running} className="px-1.5 py-0.5 rounded border border-border hover:border-amber-500 transition-colors">{ex.label}</button>))}
              </div>
            </CardContent>
          </Card>

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
                <span className="ml-auto text-amber-600">click any engine output in timeline to inspect</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-mono flex items-center gap-2"><GitBranch className="h-4 w-4 text-amber-600" /> reasoning trace <span className="text-muted-foreground font-normal">- {events.length} events</span></CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-3">
                <div className="space-y-1.5">
                  {events.map((ev) => (
                    <div key={ev.id} className={cn('rounded-md border px-3 py-2 text-xs cursor-pointer transition-all',
                      ev.type === 'engine:done' ? 'border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20' : '',
                      ev.type === 'engine:start' ? 'border-amber-500/20 opacity-60' : '',
                      ev.type === 'loop:error' ? 'border-red-500/40 bg-red-50/30' : '',
                      ev.type === 'loop:complete' ? 'border-emerald-500/40 bg-emerald-50/30' : '',
                    )} onClick={() => {
                      if (ev.type === 'engine:done' && ev.payload?.output) {
                        setInspectorData({ engine: ev.engine || 'unknown', output: ev.payload.output })
                        setActiveTab('data')
                      }
                    }}>
                      <div className="flex items-center gap-2">
                        {ev.type === 'engine:done' && <Check className="h-3 w-3 text-emerald-500" />}
                        {ev.type === 'engine:start' && <RefreshCw className="h-3 w-3 text-amber-500 animate-spin" />}
                        {ev.type === 'loop:error' && <X className="h-3 w-3 text-red-500" />}
                        {ev.type === 'loop:complete' && <Check className="h-3 w-3 text-emerald-600" />}
                        <span className="font-mono">{ev.engine || ev.type}</span>
                        {ev.iteration && <span className="text-muted-foreground">iter {ev.iteration}</span>}
                        {ev.type === 'engine:done' && ev.payload?.output && (<span className="ml-auto text-[9px] text-amber-600 flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" /> inspect</span>)}
                      </div>
                      {ev.type === 'engine:done' && ev.payload?.output && typeof ev.payload.output === 'string' && (<div className="mt-1 text-[10px] text-muted-foreground line-clamp-2 font-mono">{ev.payload.output.slice(0, 120)}...</div>)}
                      {ev.type === 'engine:done' && ev.payload?.output && typeof ev.payload.output === 'object' && (<div className="mt-1 text-[10px] text-muted-foreground font-mono">{Array.isArray(ev.payload.output) ? `${ev.payload.output.length} items` : `${Object.keys(ev.payload.output).length} fields`}</div>)}
                    </div>
                  ))}
                  {events.length === 0 && <div className="text-xs text-muted-foreground font-mono py-6 text-center">No events yet. Run a problem to see the trace.</div>}
                </div>
                <div ref={timelineEndRef} />
              </ScrollArea>
            </CardContent>
          </Card>

          {error && (
            <Card className="p-4 border-red-500/40 bg-red-50/30 dark:bg-red-950/20">
              <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                <X className="h-4 w-4 shrink-0" />
                <span className="font-mono font-bold">ERROR</span>
              </div>
              <p className="mt-1 text-xs text-red-700 dark:text-red-300 font-mono break-words">{error}</p>
              <p className="mt-2 text-[10px] text-muted-foreground">
                The loop stopped at the step shown above. Fix the issue (e.g. add an API key in Settings, or shorten the problem) and click Run again.
              </p>
            </Card>
          )}

          {finalRecord && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-mono flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> final output <span className="text-muted-foreground font-normal">- score {finalRecord.finalScore}/100</span></CardTitle></CardHeader>
              <CardContent><ScrollArea className="h-[300px]"><pre className="text-[10px] font-mono whitespace-pre-wrap break-words">{finalRecord.finalDraft}</pre></ScrollArea></CardContent>
            </Card>
          )}
        </TabsContent>

        {/* CONFIG TAB */}
        <TabsContent value="config" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-mono flex items-center gap-2"><Sliders className="h-4 w-4 text-amber-600" /> engine configuration</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between"><Label className="text-xs">Max iterations</Label><Badge variant="outline" className="font-mono text-xs">{config.maxIterations}</Badge></div>
                <Slider value={[config.maxIterations]} min={1} max={5} step={1} onValueChange={(v) => setConfig({ ...config, maxIterations: v[0] })} />
                <p className="text-[10px] text-muted-foreground">How many times the reasoning loop runs if quality is below threshold.</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between"><Label className="text-xs">Quality threshold</Label><Badge variant="outline" className="font-mono text-xs">{config.qualityThreshold}</Badge></div>
                <Slider value={[config.qualityThreshold]} min={50} max={100} step={5} onValueChange={(v) => setConfig({ ...config, qualityThreshold: v[0] })} />
                <p className="text-[10px] text-muted-foreground">Minimum quality score to deliver output.</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between"><Label className="text-xs">Temperature</Label><Badge variant="outline" className="font-mono text-xs">{config.temperature.toFixed(1)}</Badge></div>
                <Slider value={[config.temperature * 10]} min={0} max={15} step={1} onValueChange={(v) => setConfig({ ...config, temperature: v[0] / 10 })} />
                <p className="text-[10px] text-muted-foreground">0 = deterministic, 1.5 = very creative.</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between"><Label className="text-xs">LLM timeout (seconds)</Label><Badge variant="outline" className="font-mono text-xs">{config.timeout}s</Badge></div>
                <Slider value={[config.timeout]} min={30} max={180} step={15} onValueChange={(v) => setConfig({ ...config, timeout: v[0] })} />
                <p className="text-[10px] text-muted-foreground">How long to wait for each LLM call.</p>
              </div>
              <Separator />
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setConfig(DEFAULT_CONFIG)}><RotateCcw className="h-3 w-3" /> Reset to defaults</Button>
            </CardContent>
          </Card>

          {/* PER-ENGINE PROVIDER MATRIX */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-mono flex items-center gap-2"><Cpu className="h-4 w-4 text-amber-600" /> per-engine provider</CardTitle>
              <p className="text-xs text-muted-foreground">Assign different AI providers to different engines. Use expensive models only where quality matters.</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-2">
                  <span>Engine</span><span>Provider</span>
                </div>
                {LLM_ENGINES.map((engine) => (
                  <div key={engine} className="grid grid-cols-2 gap-2 items-center px-2 py-1.5 rounded-md border border-border">
                    <span className="text-xs font-mono capitalize">{engine}</span>
                    <Select
                      value={engineProviders[engine] || 'default'}
                      onValueChange={(v) => setEngineProviders(prev => ({ ...prev, [engine]: v === 'default' ? null : v as ProviderId }))}
                    >
                      <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default" className="text-xs">Default ({providerConfig.provider})</SelectItem>
                        {PROVIDERS.map(p => <SelectItem key={p.id} value={p.id} className="text-xs">{p.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-2 rounded-md bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/20">
                <p className="text-[10px] text-muted-foreground">
                  <strong className="text-amber-700 dark:text-amber-400">Tip:</strong> Use Z.ai (free) for Supervisor/Structure, OpenAI for Reasoning/Improvement (best quality), Groq for Critique/Evaluation (fast, cheap).
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Engine outputs from last run */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-mono">engine outputs (from last run)</CardTitle></CardHeader>
            <CardContent>
              {Object.keys(engineOutputs).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Run a problem to see engine outputs here.</p>
              ) : (
                <div className="space-y-1.5">
                  {Object.entries(engineOutputs).map(([key, value]) => (
                    <button key={key} onClick={() => { setInspectorData({ engine: key, output: value }); setActiveTab('data') }}
                      className="w-full flex items-center justify-between text-xs px-3 py-2 rounded-md border border-border hover:border-amber-500 transition-colors">
                      <span className="font-mono">{key}</span>
                      <span className="text-muted-foreground flex items-center gap-1">{typeof value === 'string' ? `${value.length} chars` : typeof value === 'object' ? `${Array.isArray(value) ? value.length : Object.keys(value).length} items` : 'N/A'}<Eye className="h-3 w-3" /></span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* COMPARE TAB */}
        <TabsContent value="compare" className="space-y-4 mt-4">
          <ModelComparison problem={problem} />
        </TabsContent>

        {/* PROMPTS TAB */}
        <TabsContent value="prompts" className="space-y-4 mt-4">
          <PromptInspector />
        </TabsContent>

        {/* KNOWLEDGE TAB */}
        <TabsContent value="knowledge" className="space-y-4 mt-4">
          <KnowledgePackEditor />
        </TabsContent>

        {/* DATA TAB */}
        <TabsContent value="data" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-mono flex items-center gap-2"><Code2 className="h-4 w-4 text-amber-600" /> raw data inspector</CardTitle></CardHeader>
            <CardContent>
              {!inspectorData ? (
                <p className="text-xs text-muted-foreground text-center py-8">Click any engine output in the Pipeline tab to inspect its raw data here.</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-mono text-xs">{inspectorData.engine}</Badge>
                    <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigator.clipboard?.writeText(JSON.stringify(inspectorData.output, null, 2))}>
                      <Copy className="h-3 w-3" /> Copy JSON
                    </Button>
                  </div>
                  <ScrollArea className="h-[500px]">
                    <pre className="text-[10px] font-mono whitespace-pre-wrap break-words p-3 bg-muted/30 rounded-md">{JSON.stringify(inspectorData.output, null, 2)}</pre>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============================================================
// MODEL COMPARISON - Run same problem on multiple providers
// ============================================================
function ModelComparison({ problem }: { problem: string }) {
  const [selectedProviders, setSelectedProviders] = useState<ProviderId[]>(['zai', 'groq', 'openai'])
  const [results, setResults] = useState<{ provider: string; label: string; result: any; duration: number; score: number; error?: string }[]>([])
  const [running, setRunning] = useState(false)

  const toggleProvider = (id: ProviderId) => {
    setSelectedProviders(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  const runComparison = async () => {
    if (!problem.trim() || selectedProviders.length === 0) return
    setRunning(true)
    setResults([])

    for (const providerId of selectedProviders) {
      const meta = PROVIDERS.find(p => p.id === providerId)!
      const config: ProviderConfig = providerId === 'zai' ? { provider: 'zai' } : { provider: providerId, apiKey: getStoredProviderConfig().apiKey, baseUrl: meta.defaultBaseUrl, model: meta.defaultModel }
      const start = Date.now()
      try {
        // Run just the reasoning step (interview + reasoning) for comparison
        const interview = await callInterview(problem.trim(), config)
        const retrieval = await callRetrieval(problem.trim(), interview.decomposition)
        const draft = await callReasoning({
          problem: problem.trim(), decomposition: interview.decomposition, retrieval: retrieval.output,
          priorCritique: null, priorDraft: null, iteration: 1, maxIterations: 1,
          outputTypes: ['strategy'], answers: {}, providerConfig: config,
        })
        const evaluation = await callEvaluation(draft, config, 80)
        const duration = Date.now() - start
        setResults(prev => [...prev, { provider: providerId, label: meta.label, result: draft, duration, score: evaluation.overall }])
      } catch (e: any) {
        const duration = Date.now() - start
        setResults(prev => [...prev, { provider: providerId, label: meta.label, result: null, duration, score: 0, error: e?.message ?? 'Failed' }])
      }
    }
    setRunning(false)
  }

  const bestResult = results.length > 0 ? results.reduce((best, r) => r.score > best.score ? r : best, results[0]) : null

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2"><GitCompare className="h-4 w-4 text-amber-600" /> model comparison</CardTitle>
          <p className="text-xs text-muted-foreground">Run the same problem on multiple AI providers. Compare quality, speed, and cost side-by-side.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Provider selection */}
          <div>
            <Label className="text-xs mb-2 block">Select providers to compare</Label>
            <div className="flex flex-wrap gap-1.5">
              {PROVIDERS.map(p => (
                <button key={p.id} onClick={() => toggleProvider(p.id)}
                  className={cn('px-2.5 py-1.5 rounded-md text-xs border transition-all',
                    selectedProviders.includes(p.id) ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 font-medium' : 'border-border hover:border-amber-500/50')}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Problem preview */}
          <div>
            <Label className="text-xs mb-1 block">Problem (from Pipeline tab)</Label>
            <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded-md border border-border min-h-[40px]">{problem || 'No problem entered. Go to Pipeline tab and enter a problem first.'}</div>
          </div>

          <Button onClick={runComparison} disabled={running || !problem.trim() || selectedProviders.length === 0} className="gap-2 bg-amber-600 hover:bg-amber-700 text-white">
            {running ? <><RefreshCw className="h-4 w-4 animate-spin" /> Running comparison...</> : <><Play className="h-4 w-4" /> Run comparison</>}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <>
          {/* Summary table */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-mono">results summary</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-2 font-mono text-[10px] uppercase text-muted-foreground">Provider</th>
                      <th className="text-left p-2 font-mono text-[10px] uppercase text-muted-foreground">Score</th>
                      <th className="text-left p-2 font-mono text-[10px] uppercase text-muted-foreground">Time</th>
                      <th className="text-left p-2 font-mono text-[10px] uppercase text-muted-foreground">Output</th>
                      <th className="text-left p-2 font-mono text-[10px] uppercase text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} className={cn('border-b border-border', bestResult?.provider === r.provider && 'bg-emerald-50/30 dark:bg-emerald-950/20')}>
                        <td className="p-2 font-medium">{r.label}{bestResult?.provider === r.provider && <Badge className="ml-1 text-[8px] bg-emerald-600">BEST</Badge>}</td>
                        <td className="p-2 font-mono font-bold">{r.error ? '-' : `${r.score}/100`}</td>
                        <td className="p-2 font-mono">{(r.duration / 1000).toFixed(1)}s</td>
                        <td className="p-2 font-mono">{r.result ? `${r.result.length} chars` : '-'}</td>
                        <td className="p-2">{r.error ? <Badge className="text-[9px] bg-red-500">Error</Badge> : <Badge className="text-[9px] bg-emerald-500">Success</Badge>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Side-by-side outputs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {results.map((r, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-mono">{r.label}</CardTitle>
                    <div className="flex gap-1.5">
                      <Badge variant="outline" className="text-[9px] font-mono">{(r.duration / 1000).toFixed(1)}s</Badge>
                      {r.error ? <Badge className="text-[9px] bg-red-500">Error</Badge> : <Badge className="text-[9px] bg-emerald-500">{r.score}/100</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {r.error ? (
                    <p className="text-xs text-red-500 font-mono p-2">{r.error}</p>
                  ) : (
                    <ScrollArea className="h-[300px]">
                      <pre className="text-[10px] font-mono whitespace-pre-wrap break-words">{r.result?.slice(0, 2000)}{r.result?.length > 2000 ? '\n...(truncated)' : ''}</pre>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================
// PROMPT INSPECTOR - See the actual prompts each engine sends
// ============================================================
function PromptInspector() {
  const [selectedEngine, setSelectedEngine] = useState<string>('supervisor')

  const enginePrompts: Record<string, { system: string; user: string; description: string }> = {
    supervisor: {
      description: 'Decomposes the problem into objectives, scope, stakeholders. Asks clarifying questions.',
      system: `You are the SUPERVISOR ENGINE of HubForge OS, a recursive reasoning operating system.
Your job: (1) decompose the user's problem into a structured brief, and (2) identify what critical information is MISSING by asking clarifying questions.

Respond with VALID JSON ONLY. Shape:
{
  "problemStatement": "...",
  "objectives": ["..."],
  "scope": "...",
  "stakeholders": [{"role": "...", "description": "..."}],
  "keyConsiderations": ["..."],
  "suggestedFrameworks": ["..."],
  "clarifyingQuestions": [
    {"id": "q1", "question": "...", "why": "...", "defaultAssumption": "..."}
  ]
}`,
      user: `Decompose this problem for the [DOMAIN] domain:

[USER PROBLEM]

Available frameworks:
[FRAMEWORK LIST]`,
    },
    reasoning: {
      description: 'Generates the draft strategy using retrieved knowledge, web search, and org context.',
      system: `You are the REASONING ENGINE of HubForge OS, operating with the Social Impact Pack.
Your task is to produce an expert-grade draft response to the user's problem using the retrieved knowledge.

REQUIREMENTS:
1. Ground every empirical claim in the Evidence Library or Historical Memory.
2. Apply the retrieved Frameworks explicitly.
3. Satisfy every Decision Rule.
4. Use the Reasoning Patterns to structure your analysis.
5. Be specific. Replace vague outputs with measurable targets.
6. Output in well-structured Markdown with clear ## sections.`,
      user: `# PROBLEM
[USER PROBLEM]

# RETRIEVED KNOWLEDGE
## Frameworks
[FRAMEWORK DETAILS]

## Decision Rules
[RULE DETAILS]

## Evidence Library
[EVIDENCE]

## Historical Memory
[PAST CASES]

## Live Web Research
[WEB SEARCH RESULTS]

## Organization Context
[ORG PROFILE]

# TASK
Produce the best expert-grade draft response you can.`,
    },
    critique: {
      description: 'Reviews the draft for weak assumptions, missing evidence, vague targets.',
      system: `You are the CRITIQUE ENGINE of HubForge OS.
Find weaknesses in the draft using the Improvement Heuristics. Be rigorous and specific.

Respond with VALID JSON ONLY:
{
  "issues": [{"severity": "high|medium|low", "heuristic": "<name>", "description": "<what is wrong>"}],
  "summary": "<overall quality>"
}`,
      user: `Critique this draft:

[DRAFT TEXT]`,
    },
    improvement: {
      description: 'Rewrites the draft to fix every critique issue while preserving strengths.',
      system: `You are the IMPROVEMENT ENGINE of HubForge OS.
You receive a draft and a critique. Produce an IMPROVED draft that fixes every critique issue while preserving strengths.`,
      user: `# DRAFT TO IMPROVE
[DRAFT]

# CRITIQUE TO ADDRESS
[ISSUE LIST]

# TASK
Produce the improved draft.`,
    },
    evaluation: {
      description: 'Scores the improved draft on a 6-criterion rubric (0-100).',
      system: `You are the EVALUATION ENGINE of HubForge OS.
Score the draft against the rubric. Each criterion 0-100.

Respond with VALID JSON ONLY:
{"scores": [{"criterion": "...", "score": <0-100>, "weight": <w>, "rationale": "..."}], "overall": <weighted avg>, "notes": "..."}`,
      user: `Score this draft:

[DRAFT TEXT]

Rubric:
- Evidence Base (weight 0.2)
- Measurability/SMART (weight 0.2)
- Feasibility (weight 0.2)
- Stakeholder Coverage (weight 0.15)
- Causal Logic (weight 0.15)
- Risk & Assumption Awareness (weight 0.1)

Threshold: 80`,
    },
    structure: {
      description: 'Extracts Theory of Change and Logframe from the final strategy document.',
      system: `You are the STRUCTURE ENGINE of HubForge OS. Extract a Theory of Change from the strategy document and return VALID JSON ONLY:
{"targetPopulation": "...", "inputs": ["..."], "activities": ["..."], "outputs": ["..."], "outcomes": ["..."], "impact": "...", "assumptions": ["..."], "externalFactors": ["..."]}`,
      user: `Extract the Theory of Change from:

[FINAL DRAFT]`,
    },
  }

  const current = enginePrompts[selectedEngine]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono flex items-center gap-2"><FileText className="h-4 w-4 text-amber-600" /> prompt inspector</CardTitle>
          <p className="text-xs text-muted-foreground">See the actual system and user prompts sent to the LLM for each engine. This is what the AI sees.</p>
        </CardHeader>
        <CardContent>
          {/* Engine selector */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {Object.keys(enginePrompts).map(engine => (
              <button key={engine} onClick={() => setSelectedEngine(engine)}
                className={cn('px-2.5 py-1.5 rounded-md text-xs border transition-all capitalize',
                  selectedEngine === engine ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 font-medium' : 'border-border hover:border-amber-500/50')}>
                {engine}
              </button>
            ))}
          </div>

          {/* Description */}
          <div className="mb-3 p-2 rounded-md bg-muted/30 border border-border">
            <p className="text-xs text-muted-foreground">{current.description}</p>
          </div>

          {/* System prompt */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs flex items-center gap-1"><Cpu className="h-3 w-3" /> System prompt</Label>
              <Button variant="ghost" size="sm" className="text-[10px] gap-1 h-6" onClick={() => navigator.clipboard?.writeText(current.system)}>
                <Copy className="h-3 w-3" /> Copy
              </Button>
            </div>
            <ScrollArea className="h-[200px]">
              <pre className="text-[10px] font-mono whitespace-pre-wrap break-words p-3 bg-muted/30 rounded-md border border-border">{current.system}</pre>
            </ScrollArea>
          </div>

          {/* User prompt */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs flex items-center gap-1"><FileText className="h-3 w-3" /> User prompt</Label>
              <Button variant="ghost" size="sm" className="text-[10px] gap-1 h-6" onClick={() => navigator.clipboard?.writeText(current.user)}>
                <Copy className="h-3 w-3" /> Copy
              </Button>
            </div>
            <ScrollArea className="h-[200px]">
              <pre className="text-[10px] font-mono whitespace-pre-wrap break-words p-3 bg-muted/30 rounded-md border border-border">{current.user}</pre>
            </ScrollArea>
          </div>

          <div className="mt-3 p-2 rounded-md bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/20">
            <p className="text-[10px] text-muted-foreground">
              <strong className="text-amber-700 dark:text-amber-400">Note:</strong> Prompts are defined in <code className="bg-muted px-1 rounded">src/lib/engines.ts</code>.
              The [BRACKETED] parts are replaced with actual data at runtime (problem text, retrieved knowledge, org profile, etc.).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// KNOWLEDGE PACK EDITOR
// ============================================================
function KnowledgePackEditor() {
  const [section, setSection] = useState<'frameworks' | 'rules' | 'evidence' | 'memory' | 'patterns' | 'heuristics' | 'rubric'>('frameworks')
  const [customItems, setCustomItems] = useState<Record<string, any[]>>({
    frameworks: [], rules: [], evidence: [], memory: [], patterns: [], heuristics: [],
  })

  const sections = [
    { id: 'frameworks' as const, label: 'Frameworks', count: socialImpactPack.frameworks.length, items: socialImpactPack.frameworks.map(f => ({ name: f.name, desc: f.description })) },
    { id: 'rules' as const, label: 'Decision Rules', count: socialImpactPack.decisionRules.length, items: socialImpactPack.decisionRules.map(r => ({ name: r.name, desc: r.check })) },
    { id: 'evidence' as const, label: 'Evidence', count: socialImpactPack.evidence.length, items: socialImpactPack.evidence.map(e => ({ name: e.title, desc: e.summary })) },
    { id: 'memory' as const, label: 'Historical Memory', count: socialImpactPack.historicalMemory.length, items: socialImpactPack.historicalMemory.map(m => ({ name: m.problem, desc: m.lesson })) },
    { id: 'patterns' as const, label: 'Reasoning Patterns', count: socialImpactPack.reasoningPatterns.length, items: socialImpactPack.reasoningPatterns.map(p => ({ name: p.name, desc: p.description })) },
    { id: 'heuristics' as const, label: 'Improvement Heuristics', count: socialImpactPack.improvementHeuristics.length, items: socialImpactPack.improvementHeuristics.map(h => ({ name: h.name, desc: h.description })) },
    { id: 'rubric' as const, label: 'Evaluation Rubric', count: socialImpactPack.evaluationCriteria.length, items: socialImpactPack.evaluationCriteria.map(c => ({ name: c.criterion, desc: `Weight: ${c.weight} - ${c.description}` })) },
  ]

  const current = sections.find(s => s.id === section)!
  const customCount = customItems[section]?.length || 0

  const addItem = () => {
    const name = prompt('Item name:')
    if (!name) return
    const desc = prompt('Description:')
    setCustomItems(prev => ({
      ...prev,
      [section]: [...(prev[section] || []), { name, desc: desc || '' }],
    }))
  }

  const removeCustomItem = (index: number) => {
    setCustomItems(prev => ({
      ...prev,
      [section]: (prev[section] || []).filter((_, i) => i !== index),
    }))
  }

  const exportPack = () => {
    const pack = {
      id: 'custom-pack',
      name: 'Custom Knowledge Pack',
      frameworks: socialImpactPack.frameworks,
      decisionRules: socialImpactPack.decisionRules,
      evidence: socialImpactPack.evidence,
      historicalMemory: socialImpactPack.historicalMemory,
      reasoningPatterns: socialImpactPack.reasoningPatterns,
      improvementHeuristics: socialImpactPack.improvementHeuristics,
      evaluationCriteria: socialImpactPack.evaluationCriteria,
      customItems,
    }
    const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'hubforge-knowledge-pack.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-mono flex items-center gap-2"><Database className="h-4 w-4 text-amber-600" /> knowledge pack editor</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">View, inspect, and extend the Social Impact Pack knowledge graph.</p>
            </div>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" className="text-xs gap-1" onClick={exportPack}>
                <Download className="h-3 w-3" /> Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Section tabs */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {sections.map(s => (
              <button key={s.id} onClick={() => setSection(s.id)}
                className={cn('px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1.5',
                  section === s.id ? 'bg-amber-500 text-white' : 'bg-muted hover:bg-muted/70')}>
                {s.label} <span className="opacity-60">({s.count + (customItems[s.id]?.length || 0)})</span>
              </button>
            ))}
          </div>

          {/* Add button */}
          {section !== 'rubric' && (
            <Button variant="outline" size="sm" className="mb-3 gap-1.5 text-xs" onClick={addItem}>
              <Plus className="h-3 w-3" /> Add custom {current.label.toLowerCase().replace(/s$/, '')}
            </Button>
          )}

          {/* Built-in items */}
          <ScrollArea className="h-[350px] pr-2">
            <div className="space-y-2">
              {/* Built-in items */}
              {current.items.map((item, i) => (
                <div key={i} className="rounded-md border border-border p-3 group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{item.name}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{item.desc}</div>
                    </div>
                    <Badge variant="outline" className="text-[9px] font-mono shrink-0 text-muted-foreground">built-in</Badge>
                  </div>
                </div>
              ))}

              {/* Custom items */}
              {customItems[section]?.map((item, i) => (
                <div key={`custom-${i}`} className="rounded-md border border-amber-500/30 p-3 group bg-amber-50/20 dark:bg-amber-950/10">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{item.name}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{item.desc}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge className="text-[9px] bg-amber-600">custom</Badge>
                      <button onClick={() => removeCustomItem(i)} className="text-red-400 hover:text-red-600 p-0.5">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {current.items.length === 0 && (customItems[section]?.length || 0) === 0 && (
                <div className="text-center py-8 text-xs text-muted-foreground">No items in this section.</div>
              )}
            </div>
          </ScrollArea>

          {/* Rubric weights visualization */}
          {section === 'rubric' && (
            <div className="mt-3 p-3 rounded-md bg-muted/30 border border-border">
              <p className="text-[10px] text-muted-foreground mb-2">Evaluation rubric weights (total must = 1.0):</p>
              <div className="space-y-1.5">
                {socialImpactPack.evaluationCriteria.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[10px] font-mono flex-1 truncate">{c.criterion}</span>
                    <div className="w-20 h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${c.weight * 100}%` }} />
                    </div>
                    <span className="text-[10px] font-mono w-8 text-right">{(c.weight * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-border flex justify-between text-[10px] font-mono">
                <span>Total weight:</span>
                <span className="font-bold">{socialImpactPack.evaluationCriteria.reduce((a, c) => a + c.weight, 0).toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Export/import info */}
          <div className="mt-3 p-2 rounded-md bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/20">
            <p className="text-[10px] text-muted-foreground">
              <strong className="text-amber-700 dark:text-amber-400">Export</strong> downloads the full knowledge pack as JSON.
              Custom items are included. Import coming soon.
              Source: <code className="bg-muted px-1 rounded">src/lib/knowledge.ts</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
