// HubForge OS — Reasoning Engine Mini-Service
// socket.io server that runs the recursive reasoning loop and streams
// each engine's output to connected clients in real time.
//
// Port: 3003 (fixed). Caddy forwards ?XTransformPort=3003 to this port.

import { createServer } from 'http'
import { Server } from 'socket.io'
import { socialImpactPack } from './knowledge.ts'
import {
  supervisorEngine,
  retrievalEngine,
  ruleEngine,
  reasoningEngine,
  critiqueEngine,
  improvementEngine,
  evaluationEngine,
  memoryEngine,
  getMemory,
  clearMemory,
  type MemoryRecord,
  type Decomposition,
  type RetrievalResult,
  type RuleCheckResult,
  type CritiqueResult,
  type EvaluationResult,
} from './engines.ts'

const PORT = 3003
const MAX_ITERATIONS = Number(process.env.MAX_ITERATIONS) || 2
const QUALITY_THRESHOLD = Number(process.env.QUALITY_THRESHOLD) || 80

const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/',
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 120000, // reasoning loops can take a while
  pingInterval: 25000,
})

// ---------- Event protocol ----------
// Client → Server
//   'run' { problem: string, sessionId: string }
//   'memory:list' {}
//   'memory:clear' {}
//
// Server → Client
//   'loop:start' { sessionId, problem, pack, maxIterations, threshold }
//   'engine:start' { sessionId, engine, iteration? }
//   'engine:done' { sessionId, engine, iteration?, output }
//   'engine:error' { sessionId, engine, iteration?, error }
//   'iteration:done' { sessionId, iteration, qualityScore, thresholdMet }
//   'loop:complete' { sessionId, record }
//   'loop:error' { sessionId, error }
//   'memory:list' { memory: MemoryRecord[] }

interface RunContext {
  sessionId: string
  problem: string
  pack: typeof socialImpactPack
  decomposition: Decomposition | null
  retrieval: RetrievalResult | null
  trace: MemoryRecord['trace']
  finalDraft: string
  finalScore: number
  thresholdMet: boolean
  iterations: number
}

async function runLoop(socket: any, ctx: RunContext): Promise<void> {
  const emit = (event: string, data: any) => socket.emit(event, { sessionId: ctx.sessionId, ...data })

  emit('loop:start', {
    problem: ctx.problem,
    pack: {
      id: ctx.pack.id,
      name: ctx.pack.name,
      domain: ctx.pack.domain,
      version: ctx.pack.version,
      description: ctx.pack.description,
      supports: ctx.pack.supports,
    },
    maxIterations: MAX_ITERATIONS,
    threshold: QUALITY_THRESHOLD,
  })

  // ---- Step 1: Supervisor Engine ----
  emit('engine:start', { engine: 'supervisor' })
  try {
    ctx.decomposition = await supervisorEngine(ctx.problem, ctx.pack)
    emit('engine:done', { engine: 'supervisor', output: ctx.decomposition })
  } catch (e: any) {
    emit('engine:error', { engine: 'supervisor', error: e?.message ?? String(e) })
    throw e
  }

  // ---- Step 2: Retrieval Engine (no LLM) ----
  emit('engine:start', { engine: 'retrieval' })
  ctx.retrieval = retrievalEngine(ctx.problem, ctx.decomposition, ctx.pack)
  emit('engine:done', { engine: 'retrieval', output: {
    frameworks: ctx.retrieval.frameworks.map((f) => ({ name: f.name, description: f.description })),
    decisionRules: ctx.retrieval.decisionRules.map((r) => r.name),
    evidence: ctx.retrieval.evidence.map((e) => ({ title: e.title, type: e.type })),
    historicalMemory: ctx.retrieval.historicalMemory.map((m) => m.problem),
    reasoningPatterns: ctx.retrieval.reasoningPatterns.map((p) => p.name),
    improvementHeuristics: ctx.retrieval.improvementHeuristics.map((h) => h.name),
  } })

  // ---- Recursive loop ----
  let priorDraft: string | null = null
  let priorCritiqueText: string | null = null

  for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration++) {
    const traceEntry: MemoryRecord['trace'][number] = { iteration }

    // ---- Rule Engine (deterministic) ----
    emit('engine:start', { engine: 'rule', iteration })
    const ruleChecks: RuleCheckResult[] = ruleEngine(ctx.problem, ctx.pack)
    traceEntry.ruleChecks = ruleChecks
    emit('engine:done', { engine: 'rule', iteration, output: ruleChecks })

    // ---- Reasoning Engine ----
    emit('engine:start', { engine: 'reasoning', iteration })
    const draft = await reasoningEngine(
      ctx.problem,
      ctx.decomposition,
      ctx.retrieval,
      priorCritiqueText,
      priorDraft,
      ctx.pack,
      iteration
    )
    traceEntry.draft = draft
    emit('engine:done', { engine: 'reasoning', iteration, output: draft })

    // ---- Critique Engine ----
    emit('engine:start', { engine: 'critique', iteration })
    const critique: CritiqueResult = await critiqueEngine(draft, ctx.pack)
    traceEntry.critique = critique
    emit('engine:done', { engine: 'critique', iteration, output: critique })
    priorCritiqueText = critique.issues
      .map((i) => `[${i.severity}] (${i.heuristic}) ${i.description}`)
      .join('\n')

    // ---- Improvement Engine ----
    emit('engine:start', { engine: 'improvement', iteration })
    const improved = await improvementEngine(draft, critique, ctx.pack)
    traceEntry.improved = improved
    emit('engine:done', { engine: 'improvement', iteration, output: improved })

    // ---- Evaluation Engine ----
    emit('engine:start', { engine: 'evaluation', iteration })
    const evaluation: EvaluationResult = await evaluationEngine(improved, ctx.pack, QUALITY_THRESHOLD)
    traceEntry.evaluation = evaluation
    emit('engine:done', { engine: 'evaluation', iteration, output: evaluation })

    // ---- Memory Engine (persist trace) ----
    emit('engine:start', { engine: 'memory', iteration })
    ctx.trace.push(traceEntry)
    emit('engine:done', { engine: 'memory', iteration })

    ctx.finalDraft = improved
    ctx.finalScore = evaluation.overall
    ctx.iterations = iteration
    ctx.thresholdMet = evaluation.thresholdMet

    emit('iteration:done', {
      iteration,
      qualityScore: evaluation.overall,
      thresholdMet: evaluation.thresholdMet,
    })

    priorDraft = improved

    if (evaluation.thresholdMet) {
      // Threshold reached — deliver
      break
    }
  }

  // ---- Build memory record ----
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
  }
  memoryEngine(record)

  emit('loop:complete', { record })
}

io.on('connection', (socket) => {
  console.log(`[HubForge] client connected: ${socket.id}`)

  socket.on('run', async (data: { problem: string; sessionId: string }) => {
    const { problem, sessionId } = data
    if (!problem || !sessionId) {
      socket.emit('loop:error', { sessionId, error: 'problem and sessionId are required' })
      return
    }
    console.log(`[HubForge] run sessionId=${sessionId} problem="${problem.slice(0, 80)}..."`)

    const ctx: RunContext = {
      sessionId,
      problem,
      pack: socialImpactPack,
      decomposition: null,
      retrieval: null,
      trace: [],
      finalDraft: '',
      finalScore: 0,
      thresholdMet: false,
      iterations: 0,
    }

    try {
      await runLoop(socket, ctx)
    } catch (e: any) {
      console.error(`[HubForge] loop error for ${sessionId}:`, e)
      socket.emit('loop:error', { sessionId, error: e?.message ?? String(e) })
    }
  })

  socket.on('memory:list', () => {
    socket.emit('memory:list', { memory: getMemory() })
  })

  socket.on('memory:clear', () => {
    clearMemory()
    socket.emit('memory:list', { memory: [] })
  })

  socket.on('disconnect', () => {
    console.log(`[HubForge] client disconnected: ${socket.id}`)
  })

  socket.on('error', (err: any) => {
    console.error(`[HubForge] socket error (${socket.id}):`, err)
  })
})

httpServer.listen(PORT, () => {
  console.log(`[HubForge OS] Reasoning Engine mini-service listening on port ${PORT}`)
  console.log(`[HubForge OS] MAX_ITERATIONS=${MAX_ITERATIONS}  QUALITY_THRESHOLD=${QUALITY_THRESHOLD}`)
})

process.on('SIGTERM', () => {
  console.log('[HubForge] SIGTERM, shutting down...')
  httpServer.close(() => process.exit(0))
})
process.on('SIGINT', () => {
  console.log('[HubForge] SIGINT, shutting down...')
  httpServer.close(() => process.exit(0))
})
