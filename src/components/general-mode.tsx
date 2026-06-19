'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, ArrowRight, ArrowLeft, Loader2, FileText, Workflow, Table2, ClipboardCheck,
  Settings, RefreshCw, Check, MessageSquare, Send, Lightbulb, Wand2, Download, Copy, CheckCircle2, AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { TheoryOfChangeDiagram, LogframeTable } from './deliverables'
import { EditableTheoryOfChange, EditableLogframe } from './editable-deliverables'
import {
  exportStrategyToWord, exportStrategyToPDF, exportLogframeToExcel, exportToCToExcel, exportFullReportToPDF,
} from '@/lib/export-utils'
import { OUTPUT_OPTIONS, type OutputType, type ClarifyingQuestion, type StructuredOutputs, type EvaluationResult, type Decomposition } from '@/lib/types'
import { providerDisplayLabel, type ProviderConfig } from '@/lib/providers'
import {
  callInterview, callRetrieval, callRuleChecks, callReasoning, callCritique,
  callImprovement, callEvaluation, callStructure, callFeedback, callWebSearch,
  getMemory, clearMemory, saveMemory,
} from '@/lib/api-client'
import { analytics, setAnalyticsSession } from '@/lib/analytics'
import { getOrgProfile, getOrgContextBlock } from '@/lib/organization'
import { socialImpactPackMeta, EXAMPLE_PROBLEMS } from '@/lib/social-impact-pack'
import { getProgram } from '@/lib/programs'
import { cn } from '@/lib/utils'

type Phase = 'input' | 'interview' | 'building' | 'deliverable'

// Progress steps for the live checklist
const PROGRESS_STEPS = [
  { phase: 'supervisor', label: 'Understanding your project' },
  { phase: 'retrieval', label: 'Gathering frameworks and evidence' },
  { phase: 'search', label: 'Researching demographics and previous programs' },
  { phase: 'rule', label: 'Checking the basics' },
  { phase: 'reasoning', label: 'Drafting your strategy' },
  { phase: 'critique', label: 'Reviewing the logic' },
  { phase: 'improvement', label: 'Refining the draft' },
  { phase: 'evaluation', label: 'Scoring quality' },
  { phase: 'structure', label: 'Building diagrams' },
]

const PHASE_ORDER = ['supervisor', 'retrieval', 'search', 'rule', 'reasoning', 'critique', 'improvement', 'evaluation', 'structure']

function getProgressPercent(currentPhase: string): number {
  const idx = PHASE_ORDER.indexOf(currentPhase)
  if (idx === -1) return 0
  return Math.round(((idx + 1) / PHASE_ORDER.length) * 100)
}

function getStepStatus(stepPhase: string, currentPhase: string): 'done' | 'running' | 'pending' {
  const stepIdx = PHASE_ORDER.indexOf(stepPhase)
  const currentIdx = PHASE_ORDER.indexOf(currentPhase)
  if (stepIdx < currentIdx) return 'done'
  if (stepIdx === currentIdx) return 'running'
  return 'pending'
}

interface Deliverable {
  draft: string
  evaluation: EvaluationResult | null
  structured: StructuredOutputs | null
  outputTypes: OutputType[]
}

const MAX_ITERATIONS = 2
const QUALITY_THRESHOLD = 80

export function GeneralMode({ connected, providerConfig, programId }: { connected: boolean; providerConfig: ProviderConfig; programId?: string | null }) {
  const [phase, setPhase] = useState<Phase>('input')
  const [problem, setProblem] = useState('')
  const [outputTypes, setSelectedOutputs] = useState<OutputType[]>(['strategy', 'toc'])
  const [settingsOpen, setSettingsOpen] = useState(false)

  // When a programId is passed (user clicked a saved program), load it
  // and jump straight to the deliverable phase so they see their outputs.
  useEffect(() => {
    if (!programId) return
    try {
      const program = getProgram(programId)
      if (!program) return
      setProblem(program.problem || '')
      setSelectedOutputs((program.outputTypes as OutputType[]) || ['strategy', 'toc'])
      if (program.draft || program.structured) {
        setDeliverable({
          draft: program.draft || '',
          evaluation: program.evaluation || null,
          structured: program.structured || null,
          outputTypes: (program.outputTypes as OutputType[]) || ['strategy', 'toc'],
        })
        setFeedbackHistory(program.feedbackHistory || [])
        setPhase('deliverable')
      }
    } catch {}
  }, [programId])

  const [questions, setQuestions] = useState<ClarifyingQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [skipped, setSkipped] = useState<Record<string, boolean>>({})
  const [decomposition, setDecomposition] = useState<Decomposition | null>(null)

  const [progressMsg, setProgressMsg] = useState('Starting…')
  const [progressPhase, setProgressPhase] = useState('')

  const [deliverable, setDeliverable] = useState<Deliverable | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackWorking, setFeedbackWorking] = useState(false)
  const [feedbackHistory, setFeedbackHistory] = useState<{ feedback: string; addressed: string[] }[]>([])

  const [memory, setMemory] = useState<any[]>([])

  const runLoop = useCallback(async (problemText: string, answerMap: Record<string, string>, outs: OutputType[], config: ProviderConfig) => {
    const loopSessionId = `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setAnalyticsSession(loopSessionId)
    const loopStart = Date.now()
    analytics.runStart({ problemLength: problemText.length, outputTypes: outs, provider: config.provider, skippedInterview: Object.keys(answerMap).length === 0 })

    setProgressMsg('Understanding your project…')
    setProgressPhase('supervisor')
    setPhase('building')

    try {
      let decomp = decomposition
      if (!decomp) {
        const interviewResult = await callInterview(problemText, config)
        decomp = interviewResult.decomposition
        setDecomposition(decomp)
      }

      // Retrieval
      setProgressMsg('Gathering relevant frameworks and evidence…')
      setProgressPhase('retrieval')
      const retrievalResult = await callRetrieval(problemText, decomp!)
      const retrieval = retrievalResult.output

      // Web Search - NEW: search for demographic data, previous programs, evidence
      setProgressMsg('Researching demographics, previous programs, and evidence…')
      setProgressPhase('search')
      let webSearch: any = null
      try {
        webSearch = await callWebSearch(problemText, decomp!, config)
      } catch (e) { console.warn('Web search failed:', e) }

      let priorDraft: string | null = null
      let priorCritiqueText: string | null = null
      let finalDraft = ''
      let finalScore = 0
      let thresholdMet = false
      let iterations = 0

      for (let iter = 1; iter <= MAX_ITERATIONS; iter++) {
        iterations = iter
        setProgressMsg('Checking the basics…')
        setProgressPhase('rule')

        setProgressMsg(`Drafting your strategy (iteration ${iter})…`)
        setProgressPhase('reasoning')
        const draft = await callReasoning({
          problem: problemText, decomposition: decomp!, retrieval,
          priorCritique: priorCritiqueText, priorDraft,
          iteration: iter, maxIterations: MAX_ITERATIONS,
          outputTypes: outs, answers: answerMap, providerConfig: config,
          orgContext: getOrgContextBlock(getOrgProfile()),
        })

        setProgressMsg('Reviewing the logic…')
        setProgressPhase('critique')
        const critique = await callCritique(draft, config)
        priorCritiqueText = critique.issues.map((i: any) => `[${i.severity}] (${i.heuristic}) ${i.description}`).join('\n')

        setProgressMsg('Refining the draft…')
        setProgressPhase('improvement')
        const improved = await callImprovement(draft, critique, config)

        setProgressMsg('Scoring quality…')
        setProgressPhase('evaluation')
        const evaluation = await callEvaluation(improved, config, QUALITY_THRESHOLD)

        finalDraft = improved
        finalScore = evaluation.overall
        thresholdMet = evaluation.thresholdMet
        priorDraft = improved

        if (evaluation.thresholdMet) break
      }

      let structured: StructuredOutputs = {}
      if (outs.includes('toc') || outs.includes('logframe')) {
        setProgressMsg('Building your diagrams…')
        setProgressPhase('structure')
        structured = await callStructure(finalDraft, outs, config)
      }

      const evaluation = await callEvaluation(finalDraft, config, QUALITY_THRESHOLD)

      setDeliverable({ draft: finalDraft, evaluation, structured, outputTypes: outs })
      setPhase('deliverable')

      analytics.runComplete({ finalScore, iterations, thresholdMet }, Date.now() - loopStart)
      analytics.outputViewed({ tab: 'strategy', hasToc: !!structured.toc, hasLogframe: !!structured.logframe })

      // AUTO-SAVE: Save as a program so the user can resume later
      try {
        const { createProgram, saveProgram } = await import('@/lib/programs')
        const program = createProgram({
          title: problemText.slice(0, 60) + (problemText.length > 60 ? '...' : ''),
          problem: problemText,
          outputTypes: outs,
          draft: finalDraft,
          evaluation,
          structured,
          provider: config.provider,
          tags: { sector: getOrgProfile()?.sectors?.[0], geography: getOrgProfile()?.operatingCountries?.[0] },
        })
        saveProgram(program)
      } catch {}

      // AUTO-SAVE: Save web search results as context block for reuse
      if (webSearch) {
        try {
          const { saveSearchAsBlock } = await import('@/lib/context-blocks')
          const location = problemText.match(/(?:in|at|for)\s+([A-Z][a-zA-Z\s,]+)/)?.[1]?.trim()
          if (location) saveSearchAsBlock('geography', location, webSearch)
        } catch {}
      }

      saveMemory({
        id: `s-${Date.now()}`, timestamp: new Date().toISOString(),
        problem: problemText, iterations, finalScore, thresholdMet,
        finalDraft, structuredOutputs: structured, provider: providerDisplayLabel(config),
      }).catch(() => {})
      getMemory().then(setMemory).catch(() => {})
    } catch (e: any) {
      console.error('Loop error:', e)
      analytics.runError({ error: e?.message ?? 'unknown', phase: progressPhase || 'unknown' })
      // Show error message on the building screen instead of silently going back to input
      setProgressMsg(`Error: ${e?.message ?? 'Something went wrong'}`)
      setProgressPhase('error')
      // Keep on building screen with error visible for 5 seconds, then go back to input
      setTimeout(() => {
        setPhase('input')
        setProgressPhase('')
        setProgressMsg('Starting...')
      }, 5000)
    }
  }, [decomposition, progressPhase])

  const startInterview = useCallback(async () => {
    if (!problem.trim()) return
    setProgressMsg('Understanding your project…')
    setProgressPhase('supervisor')
    setPhase('building')
    analytics.onboardingStart()

    try {
      const result = await callInterview(problem.trim(), providerConfig)
      setDecomposition(result.decomposition)
      setQuestions(result.questions || [])
      setAnswers({})
      setSkipped({})
      setDeliverable(null)
      setFeedbackHistory([])
      if ((result.questions || []).length > 0) {
        setPhase('interview')
      } else {
        await runLoop(problem.trim(), {}, outputTypes, providerConfig)
      }
    } catch (e: any) {
      setProgressMsg(`Error: ${e?.message}`)
      setPhase('input')
    }
  }, [problem, providerConfig, outputTypes, runLoop])

  const handleContinueFromInterview = () => {
    const answerMap: Record<string, string> = {}
    for (const q of questions) {
      if (skipped[q.id]) answerMap[q.id] = `[Assumption used] ${q.defaultAssumption}`
      else if (answers[q.id]?.trim()) answerMap[q.id] = answers[q.id].trim()
      else answerMap[q.id] = `[Assumption used] ${q.defaultAssumption}`
    }
    runLoop(problem.trim(), answerMap, outputTypes, providerConfig)
  }

  const handleFeedback = async () => {
    if (!feedbackText.trim() || !deliverable) return
    setFeedbackWorking(true)
    analytics.feedbackGiven({ feedbackLength: feedbackText.trim().length })
    try {
      const result = await callFeedback(deliverable.draft, feedbackText.trim(), deliverable.outputTypes, providerConfig)
      setDeliverable({ draft: result.improved, evaluation: result.evaluation, structured: result.structured, outputTypes: deliverable.outputTypes })
      setFeedbackHistory((h) => [...h, { feedback: feedbackText, addressed: result.addressed || [] }])
      analytics.feedbackComplete({ newScore: result.evaluation?.overall ?? 0, addressedCount: result.addressed?.length ?? 0 })
      setFeedbackText('')
    } catch (e: any) {
      console.error('Feedback error:', e)
      analytics.runError({ error: e?.message ?? 'feedback failed', phase: 'feedback' })
    }
    setFeedbackWorking(false)
  }

  const handleReset = () => {
    setPhase('input'); setProblem(''); setQuestions([]); setAnswers({})
    setSkipped({}); setDecomposition(null); setDeliverable(null)
    setFeedbackText(''); setFeedbackHistory([])
  }

  const toggleOutput = (id: OutputType) => {
    setSelectedOutputs((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline" className="gap-1.5 font-mono text-[10px] py-1">
          <Sparkles className="h-3 w-3 text-amber-600" />
          {providerDisplayLabel(providerConfig)}
        </Badge>
      </div>

      <AnimatePresence mode="wait">
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
              disabled={!problem.trim() || outputTypes.length === 0}
              className="w-full h-12 text-base gap-2 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Sparkles className="h-5 w-5" /> Help me build it
            </Button>
          </motion.div>
        )}

        {phase === 'interview' && (
          <motion.div key="interview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-bold">A few quick questions</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">These help us tailor the output. Skip any you're unsure about - we'll use a sensible assumption based on public evidence.</p>
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
                        <ArrowRight className="h-3 w-3" /> Skip - use public evidence / best assumption
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

        {phase === 'building' && (
          <motion.div key="building" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-12">
            <div className="w-full max-w-md space-y-4">
              {/* Error state */}
              {progressPhase === 'error' ? (
                <div className="text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center mx-auto">
                    <AlertCircle className="h-6 w-6 text-red-500" />
                  </div>
                  <p className="text-sm font-medium text-red-600">{progressMsg}</p>
                  <p className="text-xs text-muted-foreground">Returning to input in a moment... Check your AI provider settings or try again.</p>
                </div>
              ) : (
                <>
              {/* Progress header */}
              <div className="text-center">
                <p className="text-sm font-medium">{progressMsg}</p>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${getProgressPercent(progressPhase)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Live checklist */}
              <div className="space-y-1.5">
                {PROGRESS_STEPS.map((step) => {
                  const status = getStepStatus(step.phase, progressPhase)
                  return (
                    <div key={step.phase} className="flex items-center gap-2 text-xs">
                      {status === 'done' && <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                      {status === 'running' && <Loader2 className="h-3.5 w-3.5 text-amber-500 animate-spin shrink-0" />}
                      {status === 'pending' && <div className="h-3.5 w-3.5 rounded-full border-2 border-muted shrink-0" />}
                      <span className={cn(
                        status === 'done' && 'text-muted-foreground line-through',
                        status === 'running' && 'text-amber-700 dark:text-amber-400 font-medium',
                        status === 'pending' && 'text-muted-foreground/50',
                      )}>
                        {step.label}
                      </span>
                      {status === 'running' && progressPhase === 'search' && (
                        <span className="text-[10px] text-muted-foreground ml-auto animate-pulse">searching web...</span>
                      )}
                    </div>
                  )
                })}
              </div>
                </>
              )}
            </div>
          </motion.div>
        )}

        {phase === 'deliverable' && deliverable && (
          <motion.div key="deliverable" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            <DeliverableView
              deliverable={deliverable}
              feedbackText={feedbackText}
              setFeedbackText={setFeedbackText}
              onFeedback={handleFeedback}
              feedbackWorking={feedbackWorking}
              feedbackHistory={feedbackHistory}
              onReset={handleReset}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {phase === 'deliverable' && memory.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono font-bold flex items-center gap-1.5"><Sparkles className="h-3 w-3 text-amber-600" /> Past sessions</span>
            <span className="text-[10px] text-muted-foreground font-mono">{memory.length}</span>
          </div>
          <ScrollArea className="h-24">
            <div className="space-y-1">
              {memory.slice(0, 5).map((m: any) => (
                <div key={m.id} className="flex items-baseline gap-2 text-[11px]">
                  <span className={cn('font-mono font-bold', (m.final_score ?? m.finalScore) >= 80 ? 'text-emerald-600' : 'text-amber-600')}>{m.final_score ?? m.finalScore}</span>
                  <span className="truncate text-muted-foreground">{m.problem}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}
    </div>
  )
}

// Deliverable view + markdown renderer (same as before)
function DeliverableView({
  deliverable, feedbackText, setFeedbackText, onFeedback, feedbackWorking, feedbackHistory, onReset,
}: {
  deliverable: Deliverable
  feedbackText: string
  setFeedbackText: (s: string) => void
  onFeedback: () => void
  feedbackWorking: boolean
  feedbackHistory: { feedback: string; addressed: string[] }[]
  onReset: () => void
}) {
  const { draft, evaluation, structured, outputTypes } = deliverable
  const score = evaluation?.overall ?? 0
  const ready = score >= 80
  const [editableToc, setEditableToc] = useState(structured?.toc || null)
  const [editableLogframe, setEditableLogframe] = useState(structured?.logframe || null)
  const [isEditing, setIsEditing] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const hasToc = outputTypes.includes('toc')
  const hasLogframe = outputTypes.includes('logframe')
  const hasStrategy = outputTypes.includes('strategy') || outputTypes.includes('evaluation-plan')

  const tabs: { id: string; label: string; icon: any; show: boolean }[] = [
    { id: 'strategy', label: 'Strategy', icon: FileText, show: hasStrategy },
    { id: 'toc', label: 'Theory of Change', icon: Workflow, show: hasToc && !!editableToc },
    { id: 'logframe', label: 'Logframe', icon: Table2, show: hasLogframe && !!editableLogframe },
  ].filter((t) => t.show)

  const handleCopy = () => { navigator.clipboard?.writeText(draft); setCopied(true); setTimeout(() => setCopied(false), 1500) }
  const handleWord = () => exportStrategyToWord(draft)
  const handlePDF = () => exportFullReportToPDF(draft, editableToc, editableLogframe)
  const handleExcelLogframe = () => editableLogframe && exportLogframeToExcel(editableLogframe)
  const handleExcelToC = () => editableToc && exportToCToExcel(editableToc)

  return (
    <div className="space-y-4">
      {/* Status + actions - export is the hero */}
      <Card className={cn('p-4', ready ? 'border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20')}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className={cn('h-10 w-10 rounded-full flex items-center justify-center shrink-0', ready ? 'bg-emerald-500' : 'bg-amber-500')}>
            {ready ? <CheckCircle2 className="h-5 w-5 text-white" /> : <RefreshCw className="h-5 w-5 text-white" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold">{ready ? 'Ready to share' : 'Good draft - a few tweaks could help'}</h3>
            <p className="text-xs text-muted-foreground">Quality score {score}/100</p>
          </div>
        </div>
        {/* Hero export buttons - big, prominent, impossible to miss */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Button onClick={handleWord} className="gap-2 bg-amber-600 hover:bg-amber-700 text-white h-9">
            <Download className="h-4 w-4" /> Word
          </Button>
          <Button onClick={handlePDF} variant="outline" className="gap-2 h-9">
            <Download className="h-4 w-4" /> PDF
          </Button>
          {hasLogframe && (
            <Button onClick={handleExcelLogframe} variant="outline" className="gap-2 h-9">
              <Download className="h-4 w-4" /> Excel
            </Button>
          )}
          <Button onClick={handleCopy} variant="ghost" className="gap-2 h-9">
            {copied ? <><Check className="h-4 w-4 text-emerald-600" /> Copied</> : <><Copy className="h-4 w-4" /> Copy</>}
          </Button>
        </div>
      </Card>

      {/* Edit toggle + New button (secondary) */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {tabs.length > 1 && (
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => setIsEditing(e => !e)}>
              {isEditing ? <><Check className="h-3.5 w-3.5" /> Done editing</> : <><RefreshCw className="h-3.5 w-3.5" /> Edit</>}
            </Button>
          )}
        </div>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={onReset}>
          New
        </Button>
      </div>

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
              {editableToc ? (
                isEditing ? <EditableTheoryOfChange data={editableToc} onChange={setEditableToc} /> : <TheoryOfChangeDiagram data={editableToc} />
              ) : <p className="text-xs text-muted-foreground text-center py-8">Diagram not available.</p>}
            </Card>
          </TabsContent>
          <TabsContent value="logframe" className="mt-3">
            {editableLogframe ? (
              isEditing ? <EditableLogframe data={editableLogframe} onChange={setEditableLogframe} /> : <LogframeTable data={editableLogframe} />
            ) : <Card className="p-5"><p className="text-xs text-muted-foreground text-center py-8">Logframe not available.</p></Card>}
          </TabsContent>
        </Tabs>
      )}

      <Card className="p-4 border-amber-500/30">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="h-4 w-4 text-amber-600" />
          <h3 className="text-sm font-bold">Tell me what to change</h3>
        </div>
        <p className="text-[11px] text-muted-foreground mb-2.5">Be specific. We'll revise and re-check the quality. Your feedback is incorporated into the next version.</p>
        <div className="flex gap-2">
          <Textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
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
    } else if (line.startsWith('|')) {
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
