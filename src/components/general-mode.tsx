'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Socket } from 'socket.io-client'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, ArrowRight, ArrowLeft, Loader2, FileText, Workflow, Table2, ClipboardCheck,
  Settings, RefreshCw, Check, MessageSquare, Send, Lightbulb, Wand2, Download, Copy, CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { SettingsDialog } from './settings-dialog'
import { TheoryOfChangeDiagram, LogframeTable } from './deliverables'
import { OUTPUT_OPTIONS, type OutputType, type ClarifyingQuestion, type MemoryRecord, type StructuredOutputs, type EvaluationResult } from '@/lib/types'
import { getStoredProviderConfig, providerDisplayLabel, type ProviderConfig } from '@/lib/providers'
import { socialImpactPackMeta, EXAMPLE_PROBLEMS } from '@/lib/social-impact-pack'
import { cn } from '@/lib/utils'

type Phase = 'input' | 'interview' | 'building' | 'deliverable'

interface Deliverable {
  draft: string
  evaluation: EvaluationResult | null
  structured: StructuredOutputs | null
  outputTypes: OutputType[]
}

export function GeneralMode({ socket, connected }: { socket: Socket | null; connected: boolean }) {
  const [phase, setPhase] = useState<Phase>('input')
  const [problem, setProblem] = useState('')
  const [outputTypes, setSelectedOutputs] = useState<OutputType[]>(['strategy', 'toc'])
  const [providerConfig, setProviderConfig] = useState<ProviderConfig>(() => getStoredProviderConfig())
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Interview
  const [questions, setQuestions] = useState<ClarifyingQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [skipped, setSkipped] = useState<Record<string, boolean>>({})

  // Building
  const [progressMsg, setProgressMsg] = useState('Starting…')
  const [progressPhase, setProgressPhase] = useState('')

  // Deliverable
  const [deliverable, setDeliverable] = useState<Deliverable | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackWorking, setFeedbackWorking] = useState(false)
  const [feedbackHistory, setFeedbackHistory] = useState<{ feedback: string; addressed: string[] }[]>([])

  // Memory
  const [memory, setMemory] = useState<MemoryRecord[]>([])

  const sessionIdRef = useRef('')
  const startRunRef = useRef<(answerMap?: Record<string, string>, skip?: boolean) => void>(() => {})
  const feedbackTextRef = useRef('')

  // Socket listeners for General mode
  useEffect(() => {
    if (!socket) return

    const onInterviewQuestions = (p: any) => {
      if (p.sessionId !== sessionIdRef.current) return
      setQuestions(p.questions || [])
      if ((p.questions || []).length > 0) {
        setPhase('interview')
      } else {
        // No questions — go straight to building
        startRunRef.current({}, true)
      }
    }
    const onProgress = (p: any) => {
      if (p.sessionId !== sessionIdRef.current) return
      setProgressMsg(p.message)
      setProgressPhase(p.phase || '')
    }
    const onLoopComplete = (p: any) => {
      if (p.sessionId !== sessionIdRef.current) return
      const r = p.record
      setDeliverable({
        draft: r.finalDraft,
        evaluation: r.trace[r.trace.length - 1]?.evaluation ?? null,
        structured: r.structuredOutputs ?? null,
        outputTypes: r.outputTypes ?? ['strategy'],
      })
      setPhase('deliverable')
    }
    const onLoopError = (p: any) => {
      if (p.sessionId !== sessionIdRef.current) return
      setProgressMsg(`Error: ${p.error}`)
      setPhase('input')
    }
    const onFeedbackDone = (p: any) => {
      if (p.sessionId !== sessionIdRef.current) return
      setFeedbackWorking(false)
      setDeliverable((prev) => prev ? { ...prev, draft: p.improved, evaluation: p.evaluation, structured: p.structured } : null)
      setFeedbackHistory((h) => [...h, { feedback: feedbackTextRef.current, addressed: p.addressed || [] }])
      setFeedbackText('')
    }
    const onFeedbackError = (p: any) => {
      if (p.sessionId !== sessionIdRef.current) return
      setFeedbackWorking(false)
    }
    const onMemoryList = (data: { memory: MemoryRecord[] }) => setMemory(data.memory ?? [])

    socket.on('interview:questions', onInterviewQuestions)
    socket.on('progress', onProgress)
    socket.on('loop:complete', onLoopComplete)
    socket.on('loop:error', onLoopError)
    socket.on('feedback:done', onFeedbackDone)
    socket.on('feedback:error', onFeedbackError)
    socket.on('memory:list', onMemoryList)

    return () => {
      socket.off('interview:questions', onInterviewQuestions)
      socket.off('progress', onProgress)
      socket.off('loop:complete', onLoopComplete)
      socket.off('loop:error', onLoopError)
      socket.off('feedback:done', onFeedbackDone)
      socket.off('feedback:error', onFeedbackError)
      socket.off('memory:list', onMemoryList)
    }
  }, [socket])

  // ---------- Actions ----------
  const startInterview = useCallback(() => {
    if (!socket || !connected || !problem.trim()) return
    const sessionId = `g-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    sessionIdRef.current = sessionId
    setQuestions([])
    setAnswers({})
    setSkipped({})
    setDeliverable(null)
    setFeedbackHistory([])
    setProgressMsg('Understanding your project…')
    setProgressPhase('supervisor')
    setPhase('building')
    socket.emit('interview', { problem: problem.trim(), sessionId, providerConfig })
  }, [socket, connected, problem, providerConfig])

  const startRun = useCallback((answerMap?: Record<string, string>, skipInterview = false) => {
    if (!socket) return
    const sessionId = sessionIdRef.current || `g-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    sessionIdRef.current = sessionId
    const finalAnswers = answerMap ?? {}
    setProgressMsg('Gathering relevant frameworks and evidence…')
    setProgressPhase('retrieval')
    setPhase('building')
    socket.emit('run', {
      problem: problem.trim(),
      sessionId,
      answers: finalAnswers,
      outputTypes,
      providerConfig,
      skipInterview,
    })
  }, [socket, outputTypes, problem, providerConfig])

  // Keep ref in sync so socket callbacks can call the latest startRun
  useEffect(() => { startRunRef.current = startRun }, [startRun])

  const updateFeedbackText = useCallback((s: string) => {
    feedbackTextRef.current = s
    setFeedbackText(s)
  }, [])

  const handleContinueFromInterview = () => {
    // Build answer map: use answer text, or the default assumption if skipped
    const answerMap: Record<string, string> = {}
    for (const q of questions) {
      if (skipped[q.id]) {
        answerMap[q.id] = `[Assumption used] ${q.defaultAssumption}`
      } else if (answers[q.id]?.trim()) {
        answerMap[q.id] = answers[q.id].trim()
      } else {
        answerMap[q.id] = `[Assumption used] ${q.defaultAssumption}`
      }
    }
    startRun(answerMap, true)
  }

  const handleFeedback = () => {
    if (!socket || !feedbackText.trim() || !deliverable) return
    setFeedbackWorking(true)
    socket.emit('feedback', {
      sessionId: sessionIdRef.current,
      feedback: feedbackText.trim(),
      currentDraft: deliverable.draft,
      outputTypes: deliverable.outputTypes,
      providerConfig,
    })
  }

  const handleReset = () => {
    setPhase('input')
    setProblem('')
    setQuestions([])
    setAnswers({})
    setSkipped({})
    setDeliverable(null)
    setFeedbackText('')
    setFeedbackHistory([])
  }

  const toggleOutput = (id: OutputType) => {
    setSelectedOutputs((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  const copyDraft = () => {
    if (deliverable?.draft) navigator.clipboard?.writeText(deliverable.draft)
  }

  // ---------- Render ----------
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Top bar: provider + settings */}
      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline" className="gap-1.5 font-mono text-[10px] py-1">
          <Sparkles className="h-3 w-3 text-amber-600" />
          {providerDisplayLabel(providerConfig)}
        </Badge>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => setSettingsOpen(true)}>
          <Settings className="h-3.5 w-3.5" /> AI settings
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {/* =================== PHASE: INPUT =================== */}
        {phase === 'input' && (
          <motion.div key="input" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
            <Card className="p-6 sm:p-8 shadow-sm">
              <div className="flex items-start gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
                  <Wand2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight">What are you working on?</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Describe your project, paste a draft proposal, or share an idea. We'll handle the M&E expertise.</p>
                </div>
              </div>

              <Textarea
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="e.g. We want to improve school attendance for 2,000 children in rural Kenya. We have $50k and 18 months. Help us design the program and a theory of change."
                className="min-h-[130px] resize-y text-sm leading-relaxed"
              />

              {/* Example chips */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="text-[10px] font-mono text-muted-foreground self-center">try:</span>
                {EXAMPLE_PROBLEMS.map((ex) => (
                  <button key={ex.label} type="button" onClick={() => setProblem(ex.problem)}
                    className="px-2 py-1 rounded-full border border-border text-[10px] hover:border-amber-500 hover:text-amber-700 dark:hover:text-amber-300 transition-colors">
                    {ex.label}
                  </button>
                ))}
              </div>
            </Card>

            {/* Output selection */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-bold">What would you like me to produce?</h3>
                <span className="text-[10px] text-muted-foreground font-mono ml-auto">pick one or more</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {OUTPUT_OPTIONS.map((opt) => {
                  const Icon = opt.icon === 'FileText' ? FileText : opt.icon === 'Workflow' ? Workflow : opt.icon === 'Table2' ? Table2 : ClipboardCheck
                  const selected = outputTypes.includes(opt.id)
                  return (
                    <button key={opt.id} type="button" onClick={() => toggleOutput(opt.id)}
                      className={cn('text-left rounded-lg border p-3 transition-all flex gap-3',
                        selected ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20' : 'border-border hover:border-amber-500/50')}>
                      <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', selected ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground')}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium">{opt.label}</span>
                          {selected && <Check className="h-3.5 w-3.5 text-amber-600" />}
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{opt.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </Card>

            <Button
              onClick={startInterview}
              disabled={!connected || !problem.trim() || outputTypes.length === 0}
              className="w-full h-12 text-base gap-2 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {connected ? <><Sparkles className="h-5 w-5" /> Help me build it</> : <><Loader2 className="h-5 w-5 animate-spin" /> Connecting…</>}
            </Button>
          </motion.div>
        )}

        {/* =================== PHASE: INTERVIEW =================== */}
        {phase === 'interview' && (
          <motion.div key="interview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-bold">A few quick questions</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">These help us tailor the output. Skip any you're unsure about — we'll use a sensible assumption based on public evidence.</p>

              <div className="space-y-4">
                {questions.map((q, i) => (
                  <div key={q.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start gap-2 mb-1">
                      <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 font-bold mt-0.5">Q{i + 1}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium leading-snug">{q.question}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Why we ask: {q.why}</p>
                      </div>
                    </div>
                    <Textarea
                      value={answers[q.id] ?? ''}
                      onChange={(e) => { setAnswers((a) => ({ ...a, [q.id]: e.target.value })); setSkipped((s) => ({ ...s, [q.id]: false })) }}
                      placeholder="Your answer…"
                      className="min-h-[60px] text-sm mt-2"
                      disabled={skipped[q.id]}
                    />
                    {skipped[q.id] ? (
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <p className="text-[11px] text-muted-foreground italic">Using assumption: {q.defaultAssumption}</p>
                        <button type="button" onClick={() => setSkipped((s) => ({ ...s, [q.id]: false }))}
                          className="text-[10px] text-amber-700 dark:text-amber-400 hover:underline">answer instead</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setSkipped((s) => ({ ...s, [q.id]: true }))}
                        className="mt-1.5 text-[10px] text-muted-foreground hover:text-amber-700 dark:hover:text-amber-400 inline-flex items-center gap-1">
                        <ArrowRight className="h-3 w-3" /> Skip — use public evidence / best assumption
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPhase('input')} className="gap-1.5">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button onClick={handleContinueFromInterview} className="flex-1 gap-2 bg-amber-600 hover:bg-amber-700 text-white">
                <Sparkles className="h-4 w-4" /> Build my {outputTypes.map((o) => OUTPUT_OPTIONS.find((x) => x.id === o)?.label.split(' ')[0]).join(' + ')}
              </Button>
            </div>
          </motion.div>
        )}

        {/* =================== PHASE: BUILDING =================== */}
        {phase === 'building' && (
          <motion.div key="building" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20">
            <BuildingProgress message={progressMsg} phase={progressPhase} />
          </motion.div>
        )}

        {/* =================== PHASE: DELIVERABLE =================== */}
        {phase === 'deliverable' && deliverable && (
          <motion.div key="deliverable" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            <DeliverableView
              deliverable={deliverable}
              feedbackText={feedbackText}
              setFeedbackText={updateFeedbackText}
              onFeedback={handleFeedback}
              feedbackWorking={feedbackWorking}
              feedbackHistory={feedbackHistory}
              onCopy={copyDraft}
              onReset={handleReset}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Memory (collapsed, shown in deliverable phase) */}
      {phase === 'deliverable' && memory.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono font-bold flex items-center gap-1.5"><Sparkles className="h-3 w-3 text-amber-600" /> Past sessions</span>
            <span className="text-[10px] text-muted-foreground font-mono">{memory.length}</span>
          </div>
          <ScrollArea className="h-24">
            <div className="space-y-1">
              {memory.slice(0, 5).map((m) => (
                <div key={m.id} className="flex items-baseline gap-2 text-[11px]">
                  <span className={cn('font-mono font-bold', m.finalScore >= 80 ? 'text-emerald-600' : 'text-amber-600')}>{m.finalScore}</span>
                  <span className="truncate text-muted-foreground">{m.problem}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} onSaved={setProviderConfig} />
    </div>
  )
}

// ============================================================
// Building progress — single clean animated indicator
// ============================================================
function BuildingProgress({ message, phase }: { message: string; phase: string }) {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative h-20 w-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-4 border-amber-200 border-t-amber-600"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="h-7 w-7 text-amber-600" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">{message}</p>
        <p className="text-[10px] text-muted-foreground font-mono mt-1">{phase || 'starting'}</p>
      </div>
    </div>
  )
}

// ============================================================
// Deliverable view — the output with feedback bar
// ============================================================
function DeliverableView({
  deliverable, feedbackText, setFeedbackText: updateFeedbackText, onFeedback, feedbackWorking, feedbackHistory, onCopy, onReset,
}: {
  deliverable: Deliverable
  feedbackText: string
  setFeedbackText: (s: string) => void
  onFeedback: () => void
  feedbackWorking: boolean
  feedbackHistory: { feedback: string; addressed: string[] }[]
  onCopy: () => void
  onReset: () => void
}) {
  const { draft, evaluation, structured, outputTypes } = deliverable
  const score = evaluation?.overall ?? 0
  const ready = score >= 80
  const hasToc = structured?.toc && outputTypes.includes('toc')
  const hasLogframe = structured?.logframe && outputTypes.includes('logframe')
  const hasStrategy = outputTypes.includes('strategy') || outputTypes.includes('evaluation-plan')
  const [copied, setCopied] = useState(false)

  const tabs: { id: string; label: string; icon: any; show: boolean }[] = [
    { id: 'strategy', label: 'Strategy', icon: FileText, show: hasStrategy },
    { id: 'toc', label: 'Theory of Change', icon: Workflow, show: !!hasToc },
    { id: 'logframe', label: 'Logframe', icon: Table2, show: !!hasLogframe },
  ].filter((t) => t.show)

  const handleCopy = () => { onCopy(); setCopied(true); setTimeout(() => setCopied(false), 1500) }

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <Card className={cn('p-4', ready ? 'border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20')}>
        <div className="flex items-center gap-3">
          <div className={cn('h-10 w-10 rounded-full flex items-center justify-center', ready ? 'bg-emerald-500' : 'bg-amber-500')}>
            {ready ? <CheckCircle2 className="h-5 w-5 text-white" /> : <RefreshCw className="h-5 w-5 text-white" />}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold">{ready ? 'Ready to share' : 'Good draft — a few tweaks could help'}</h3>
            <p className="text-xs text-muted-foreground">
              Quality score {score}/100 {ready ? '· meets our quality threshold' : '· below the 80 threshold but still usable'}
            </p>
          </div>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleCopy}>
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />} Copy
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={onReset}>
              <RefreshCw className="h-3.5 w-3.5" /> New
            </Button>
          </div>
        </div>
      </Card>

      {/* Deliverable tabs */}
      {tabs.length > 0 && (
        <Tabs defaultValue={tabs[0].id}>
          <TabsList className="w-full justify-start flex-wrap h-auto">
            {tabs.map((t) => (
              <TabsTrigger key={t.id} value={t.id} className="gap-1.5 text-xs">
                <t.icon className="h-3.5 w-3.5" /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="strategy" className="mt-3">
            <Card className="p-5">
              <ScrollArea className="h-[520px]">
                <MarkdownRender text={draft} />
              </ScrollArea>
            </Card>
          </TabsContent>

          <TabsContent value="toc" className="mt-3">
            <Card className="p-5">
              {hasToc && structured?.toc ? <TheoryOfChangeDiagram data={structured.toc} /> : (
                <p className="text-xs text-muted-foreground text-center py-8">Diagram not available.</p>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="logframe" className="mt-3">
            {hasLogframe && structured?.logframe ? <LogframeTable data={structured.logframe} /> : (
              <Card className="p-5"><p className="text-xs text-muted-foreground text-center py-8">Logframe not available.</p></Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Feedback bar */}
      <Card className="p-4 border-amber-500/30">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="h-4 w-4 text-amber-600" />
          <h3 className="text-sm font-bold">Tell me what to change</h3>
        </div>
        <p className="text-[11px] text-muted-foreground mb-2.5">Be specific. We'll revise and re-check the quality. Your feedback is incorporated into the next version.</p>
        <div className="flex gap-2">
          <Textarea
            value={feedbackText}
            onChange={(e) => updateFeedbackText(e.target.value)}
            placeholder="e.g. Make the assumptions about market access more explicit. Add a risk row on input price volatility."
            className="min-h-[56px] text-sm resize-none"
            disabled={feedbackWorking}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onFeedback() }}
          />
          <Button onClick={onFeedback} disabled={feedbackWorking || !feedbackText.trim()} className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white self-end">
            {feedbackWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="hidden sm:inline">{feedbackWorking ? 'Revising…' : 'Improve'}</span>
          </Button>
        </div>

        {/* Feedback history */}
        {feedbackHistory.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border space-y-2">
            {feedbackHistory.map((fh, i) => (
              <div key={i} className="text-[11px]">
                <div className="flex items-start gap-1.5">
                  <span className="text-amber-600 font-mono font-bold shrink-0">v{i + 2}</span>
                  <div>
                    <p className="text-muted-foreground italic">"{fh.feedback}"</p>
                    {fh.addressed.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {fh.addressed.map((a, j) => (
                          <li key={j} className="flex items-start gap-1"><Check className="h-3 w-3 text-emerald-600 mt-0.5 shrink-0" /> <span>{a}</span></li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// ============================================================
// Lightweight markdown renderer
// ============================================================
function MarkdownRender({ text }: { text: string }) {
  const lines = text.split('\n')
  const blocks: React.ReactNode[] = []
  let i = 0
  let key = 0
  while (i < lines.length) {
    const line = lines[i]
    if (/^#{1,6}\s/.test(line)) {
      const level = line.match(/^(#{1,6})/)![1].length
      const content = line.replace(/^#{1,6}\s/, '')
      const cls = level <= 2 ? 'text-base font-bold mt-4 mb-2 text-stone-900 dark:text-stone-100' : 'text-sm font-bold mt-3 mb-1 text-stone-800 dark:text-stone-200'
      blocks.push(<div key={key++} className={cls}>{inlineMd(content)}</div>)
    } else if (/^\s*[-*]\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*]\s/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*]\s/, '')); i++ }
      i--
      blocks.push(<ul key={key++} className="list-disc pl-5 space-y-1 my-2">{items.map((it, j) => <li key={j} className="text-sm leading-relaxed">{inlineMd(it)}</li>)}</ul>)
    } else if (/^\s*\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*\d+\.\s/.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+\.\s/, '')); i++ }
      i--
      blocks.push(<ol key={key++} className="list-decimal pl-5 space-y-1 my-2">{items.map((it, j) => <li key={j} className="text-sm leading-relaxed">{inlineMd(it)}</li>)}</ol>)
    } else if (line.trim() === '') {
      // skip
    } else if (line.startsWith('|')) {
      // markdown table
      const tableLines: string[] = []
      while (i < lines.length && lines[i].startsWith('|')) { tableLines.push(lines[i]); i++ }
      i--
      const parsed = parseMdTable(tableLines)
      if (parsed) {
        blocks.push(
          <div key={key++} className="overflow-x-auto my-3">
            <table className="w-full text-xs border-collapse">
              <thead><tr className="bg-muted">{parsed.headers.map((h, j) => <th key={j} className="text-left p-2 border border-border font-medium">{h}</th>)}</tr></thead>
              <tbody>{parsed.rows.map((row, j) => (
                <tr key={j} className="border-b border-border">{row.map((c, k) => <td key={k} className="p-2 border border-border align-top leading-snug">{inlineMd(c)}</td>)}</tr>
              ))}</tbody>
            </table>
          </div>
        )
      }
    } else {
      blocks.push(<p key={key++} className="text-sm my-1.5 leading-relaxed">{inlineMd(line)}</p>)
    }
    i++
  }
  return <div>{blocks}</div>
}

function parseMdTable(lines: string[]): { headers: string[]; rows: string[][] } | null {
  if (lines.length < 2) return null
  const split = (l: string) => l.replace(/^\||\|$/g, '').split('|').map((s) => s.trim())
  const headers = split(lines[0])
  // skip separator line
  const rows = lines.slice(2).map(split)
  return { headers, rows }
}

function inlineMd(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let rest = text
  let key = 0
  while (rest.length > 0) {
    const bold = rest.match(/\*\*(.+?)\*\*/)
    const code = rest.match(/`(.+?)`/)
    const cands = [bold, code].filter(Boolean) as RegExpMatchArray[]
    if (cands.length === 0) { parts.push(rest); break }
    cands.sort((a, b) => a.index! - b.index!)
    const next = cands[0]
    if (next.index! > 0) parts.push(rest.slice(0, next.index!))
    if (next === bold) parts.push(<strong key={key++} className="font-semibold">{bold![1]}</strong>)
    else parts.push(<code key={key++} className="px-1 py-0.5 rounded bg-muted text-xs font-mono">{code![1]}</code>)
    rest = rest.slice(next.index! + next[0].length)
  }
  return parts
}
