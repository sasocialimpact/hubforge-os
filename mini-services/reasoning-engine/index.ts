// HubForge OS — Reasoning Engine Mini-Service
// socket.io server: recursive reasoning loop, guided interview, structured
// outputs, feedback, and multi-provider LLM routing.
//
// Port: 3003 (fixed). Caddy forwards ?XTransformPort=3003 to this port.

import { createServer } from 'http'
import { Server } from 'socket.io'
import { socialImpactPack } from './knowledge.ts'
import {
  supervisorEngine, retrievalEngine, ruleEngine, reasoningEngine,
  critiqueEngine, improvementEngine, evaluationEngine, memoryEngine,
  structureEngine, feedbackEngine, getMemory, clearMemory,
  describeProvider, normalizeConfig,
  type ProviderConfig, type Decomposition, type RetrievalResult, type RuleCheckResult,
  type CritiqueResult, type EvaluationResult, type MemoryRecord, type OutputType,
  type StructuredOutputs,
} from './engines.ts'

const PORT = 3003
const MAX_ITERATIONS = Number(process.env.MAX_ITERATIONS) || 2
const QUALITY_THRESHOLD = Number(process.env.QUALITY_THRESHOLD) || 80

const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/',
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 180000,
  pingInterval: 25000,
})

// ---------- Event protocol ----------
// Client → Server
//   'interview' { problem, sessionId, providerConfig }
//     → 'interview:questions' { sessionId, decomposition, questions }
//   'run' { problem, sessionId, answers, outputTypes, providerConfig, skipInterview }
//   'feedback' { sessionId, feedback, providerConfig }
//   'memory:list' {}
//   'memory:clear' {}
//
// Server → Client (all carry sessionId)
//   'loop:start' { problem, pack, maxIterations, threshold, provider }
//   'engine:start' { engine, iteration? }
//   'engine:done' { engine, iteration?, output }
//   'engine:error' { engine, iteration?, error }
//   'progress' { message, phase }        — friendly status for General mode
//   'iteration:done' { iteration, qualityScore, thresholdMet }
//   'loop:complete' { record }           — record includes structuredOutputs
//   'loop:error' { error }
//   'feedback:done' { improved, addressed, evaluation, structured }
//   'feedback:error' { error }
//   'memory:list' { memory }

interface RunContext {
  sessionId: string
  problem: string
  providerConfig: ProviderConfig
  decomposition: Decomposition | null
  retrieval: RetrievalResult | null
  trace: MemoryRecord['trace']
  finalDraft: string
  finalScore: number
  thresholdMet: boolean
  iterations: number
  answers: Record<string, string>
  outputTypes: OutputType[]
}

const FRIENDLY_PHASES: { engine: string; message: string }[] = [
  { engine: 'supervisor', message: 'Understanding your project…' },
  { engine: 'retrieval', message: 'Gathering relevant frameworks and evidence…' },
  { engine: 'rule', message: 'Checking the basics…' },
  { engine: 'reasoning', message: 'Drafting your strategy…' },
  { engine: 'critique', message: 'Reviewing the logic…' },
  { engine: 'improvement', message: 'Refining the draft…' },
  { engine: 'evaluation', message: 'Scoring quality…' },
  { engine: 'memory', message: 'Saving what we learned…' },
]

io.on('connection', (socket) => {
  console.log(`[HubForge] client connected: ${socket.id}`)

  // ---------- Interview ----------
  socket.on('interview', async (data: { problem: string; sessionId: string; providerConfig?: ProviderConfig }) => {
    const { problem, sessionId } = data
    const providerConfig = normalizeConfig(data.providerConfig)
    console.log(`[HubForge] interview sessionId=${sessionId}`)
    try {
      const decomposition = await supervisorEngine(providerConfig, problem, socialImpactPack)
      socket.emit('interview:questions', {
        sessionId,
        decomposition: {
          problemStatement: decomposition.problemStatement,
          objectives: decomposition.objectives,
          scope: decomposition.scope,
          stakeholders: decomposition.stakeholders,
          keyConsiderations: decomposition.keyConsiderations,
          suggestedFrameworks: decomposition.suggestedFrameworks,
        },
        questions: decomposition.clarifyingQuestions ?? [],
        provider: describeProvider(providerConfig),
      })
    } catch (e: any) {
      console.error(`[HubForge] interview error:`, e)
      socket.emit('loop:error', { sessionId, error: `Interview failed: ${e?.message ?? String(e)}` })
    }
  })

  // ---------- Full run ----------
  socket.on('run', async (data: {
    problem: string
    sessionId: string
    answers?: Record<string, string>
    outputTypes?: OutputType[]
    providerConfig?: ProviderConfig
    skipInterview?: boolean
  }) => {
    const { problem, sessionId } = data
    const providerConfig = normalizeConfig(data.providerConfig)
    const answers = data.answers ?? {}
    const outputTypes = data.outputTypes ?? (['strategy'] as OutputType[])

    console.log(`[HubForge] run sessionId=${sessionId} provider=${providerConfig.provider} outputs=[${outputTypes.join(',')}]`)

    const ctx: RunContext = {
      sessionId, problem, providerConfig,
      decomposition: null, retrieval: null, trace: [],
      finalDraft: '', finalScore: 0, thresholdMet: false, iterations: 0,
      answers, outputTypes,
    }

    try {
      await runLoop(socket, ctx)
    } catch (e: any) {
      console.error(`[HubForge] loop error for ${sessionId}:`, e)
      socket.emit('loop:error', { sessionId, error: e?.message ?? String(e) })
    }
  })

  // ---------- Feedback ----------
  socket.on('feedback', async (data: {
    sessionId: string
    feedback: string
    currentDraft: string
    outputTypes?: OutputType[]
    providerConfig?: ProviderConfig
  }) => {
    const { sessionId, feedback, currentDraft } = data
    const providerConfig = normalizeConfig(data.providerConfig)
    const outputTypes = data.outputTypes ?? (['strategy'] as OutputType[])
    console.log(`[HubForge] feedback sessionId=${sessionId}`)
    socket.emit('feedback:start', { sessionId })
    try {
      socket.emit('progress', { sessionId, message: 'Revising based on your feedback…', phase: 'feedback' })
      const { improved, feedbackAddressed } = await feedbackEngine(providerConfig, currentDraft, feedback, socialImpactPack)
      socket.emit('progress', { sessionId, message: 'Re-checking quality…', phase: 'feedback-eval' })
      const evaluation = await evaluationEngine(providerConfig, improved, socialImpactPack, QUALITY_THRESHOLD)
      socket.emit('progress', { sessionId, message: 'Preparing diagrams…', phase: 'feedback-structure' })
      const structured = await structureEngine(providerConfig, improved, outputTypes)
      socket.emit('feedback:done', { sessionId, improved, addressed: feedbackAddressed, evaluation, structured })
    } catch (e: any) {
      console.error(`[HubForge] feedback error:`, e)
      socket.emit('feedback:error', { sessionId, error: e?.message ?? String(e) })
    }
  })

  socket.on('memory:list', () => socket.emit('memory:list', { memory: getMemory() }))
  socket.on('memory:clear', () => socket.emit('memory:list', { memory: [] }))

  socket.on('disconnect', () => console.log(`[HubForge] client disconnected: ${socket.id}`))
  socket.on('error', (err: any) => console.error(`[HubForge] socket error (${socket.id}):`, err))
})

async function runLoop(socket: any, ctx: RunContext): Promise<void> {
  const emit = (event: string, data: any) => socket.emit(event, { sessionId: ctx.sessionId, ...data })
  const emitProgress = (engine: string) => {
    const f = FRIENDLY_PHASES.find((p) => p.engine === engine)
    if (f) emit('progress', { message: f.message, phase: engine })
  }

  emit('loop:start', {
    problem: ctx.problem,
    pack: {
      id: socialImpactPack.id, name: socialImpactPack.name, domain: socialImpactPack.domain,
      version: socialImpactPack.version, description: socialImpactPack.description, supports: socialImpactPack.supports,
    },
    maxIterations: MAX_ITERATIONS, threshold: QUALITY_THRESHOLD,
    provider: describeProvider(ctx.providerConfig),
    outputTypes: ctx.outputTypes,
  })

  // ---- Supervisor ----
  emitProgress('supervisor')
  emit('engine:start', { engine: 'supervisor' })
  ctx.decomposition = await supervisorEngine(ctx.providerConfig, ctx.problem, socialImpactPack, ctx.answers)
  emit('engine:done', { engine: 'supervisor', output: ctx.decomposition })

  // ---- Retrieval ----
  emitProgress('retrieval')
  emit('engine:start', { engine: 'retrieval' })
  ctx.retrieval = retrievalEngine(ctx.problem, ctx.decomposition, socialImpactPack)
  emit('engine:done', { engine: 'retrieval', output: {
    frameworks: ctx.retrieval.frameworks.map((f) => ({ name: f.name, description: f.description })),
    decisionRules: ctx.retrieval.decisionRules.map((r) => r.name),
    evidence: ctx.retrieval.evidence.map((e) => ({ title: e.title, type: e.type })),
    historicalMemory: ctx.retrieval.historicalMemory.map((m) => m.problem),
    reasoningPatterns: ctx.retrieval.reasoningPatterns.map((p) => p.name),
    improvementHeuristics: ctx.retrieval.improvementHeuristics.map((h) => h.name),
  } })

  let priorDraft: string | null = null
  let priorCritiqueText: string | null = null

  for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
    const traceEntry: MemoryRecord['trace'][number] = { iteration }

    emitProgress('rule')
    emit('engine:start', { engine: 'rule', iteration })
    const ruleChecks: RuleCheckResult[] = ruleEngine(ctx.problem, socialImpactPack)
    traceEntry.ruleChecks = ruleChecks
    emit('engine:done', { engine: 'rule', iteration, output: ruleChecks })

    emitProgress('reasoning')
    emit('engine:start', { engine: 'reasoning', iteration })
    const draft = await reasoningEngine(ctx.providerConfig, ctx.problem, ctx.decomposition, ctx.retrieval, priorCritiqueText, priorDraft, socialImpactPack, iteration, MAX_ITERATIONS, ctx.outputTypes, ctx.answers)
    traceEntry.draft = draft
    emit('engine:done', { engine: 'reasoning', iteration, output: draft })

    emitProgress('critique')
    emit('engine:start', { engine: 'critique', iteration })
    const critique: CritiqueResult = await critiqueEngine(ctx.providerConfig, draft, socialImpactPack)
    traceEntry.critique = critique
    emit('engine:done', { engine: 'critique', iteration, output: critique })
    priorCritiqueText = critique.issues.map((i) => `[${i.severity}] (${i.heuristic}) ${i.description}`).join('\n')

    emitProgress('improvement')
    emit('engine:start', { engine: 'improvement', iteration })
    const improved = await improvementEngine(ctx.providerConfig, draft, critique, socialImpactPack)
    traceEntry.improved = improved
    emit('engine:done', { engine: 'improvement', iteration, output: improved })

    emitProgress('evaluation')
    emit('engine:start', { engine: 'evaluation', iteration })
    const evaluation: EvaluationResult = await evaluationEngine(ctx.providerConfig, improved, socialImpactPack, QUALITY_THRESHOLD)
    traceEntry.evaluation = evaluation
    emit('engine:done', { engine: 'evaluation', iteration, output: evaluation })

    emitProgress('memory')
    emit('engine:start', { engine: 'memory', iteration })
    ctx.trace.push(traceEntry)
    emit('engine:done', { engine: 'memory', iteration })

    ctx.finalDraft = improved
    ctx.finalScore = evaluation.overall
    ctx.iterations = iteration
    ctx.thresholdMet = evaluation.thresholdMet

    emit('iteration:done', { iteration, qualityScore: evaluation.overall, thresholdMet: evaluation.thresholdMet })

    priorDraft = improved
    if (evaluation.thresholdMet) break
  }

  // ---- Structure (diagrams) ----
  let structuredOutputs: StructuredOutputs = {}
  if (ctx.outputTypes.includes('toc') || ctx.outputTypes.includes('logframe')) {
    emit('progress', { message: 'Building your diagrams…', phase: 'structure' })
    structuredOutputs = await structureEngine(ctx.providerConfig, ctx.finalDraft, ctx.outputTypes)
  }

  const record: MemoryRecord = {
    id: `${ctx.sessionId}-${Date.now()}`,
    timestamp: new Date().toISOString(),
    problem: ctx.problem,
    iterations: ctx.iterations,
    finalScore: ctx.finalScore,
    thresholdMet: ctx.thresholdMet,
    decomposition: ctx.decomposition!,
    retrieval: {
      frameworks: ctx.retrieval!.frameworks.map((f) => f.name),
      rules: ctx.retrieval!.decisionRules.map((r) => r.name),
      evidence: ctx.retrieval!.evidence.map((e) => e.title),
    },
    trace: ctx.trace,
    finalDraft: ctx.finalDraft,
    answers: ctx.answers,
    outputTypes: ctx.outputTypes,
    provider: describeProvider(ctx.providerConfig),
    structuredOutputs,
  }
  memoryEngine(record)
  emit('loop:complete', { record })
}

httpServer.listen(PORT, () => {
  console.log(`[HubForge OS] Reasoning Engine listening on port ${PORT}`)
  console.log(`[HubForge OS] MAX_ITERATIONS=${MAX_ITERATIONS}  QUALITY_THRESHOLD=${QUALITY_THRESHOLD}`)
})

process.on('SIGTERM', () => { httpServer.close(() => process.exit(0)) })
process.on('SIGINT', () => { httpServer.close(() => process.exit(0)) })
