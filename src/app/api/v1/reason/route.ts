// POST /api/v1/reason - Public API v1: run the 9-engine reasoning pipeline.
//
// This is the Win32 moment. Third parties can now call HubForge's kernel
// programmatically: NGOs, consultants, donor platforms, other M&E tools.
//
// Request:
//   {
//     "problem": "Design a literacy program for 500 children in rural Kenya",
//     "providerConfig": { "provider": "zai" },  // optional
//     "outputTypes": ["strategy", "toc", "logframe"],  // optional
//     "maxIterations": 2,  // optional, default 2
//     "qualityThreshold": 80  // optional, default 80
//   }
//
// Response:
//   {
//     "strategy": "# Strategy Document\n...",
//     "evaluation": { "overall": 85, "thresholdMet": true },
//     "structured": { "toc": {...}, "logframe": {...} },
//     "iterations": 1,
//     "provider": "Z.ai (shared, free)",
//     "durationMs": 45000
//   }
//
// Auth: For now, no API key required (shared Z.ai key is used). When the
// platform scales, add HUBFORGE_API_KEY env var + Bearer token check.
// Users who pass their own providerConfig.apiKey bypass the shared key.
import { NextRequest, NextResponse } from 'next/server'
import {
  supervisorEngine, retrievalEngine, ruleEngine, reasoningEngine,
  critiqueEngine, improvementEngine, evaluationEngine, structureEngine,
  normalizeConfig, describeProvider,
  type ProviderConfig, type OutputType,
} from '@/lib/engine-access'
import { getMergedPack } from '@/lib/knowledge-overrides'
import { checkRateLimit, recordStrategyGeneration } from '@/lib/server/rate-limit-server'

export const maxDuration = 90

export async function POST(req: NextRequest) {
  const start = Date.now()
  try {
    const body = await req.json()
    const { problem, providerConfig, outputTypes, maxIterations, qualityThreshold } = body as {
      problem: string
      providerConfig?: ProviderConfig
      outputTypes?: OutputType[]
      maxIterations?: number
      qualityThreshold?: number
    }

    // ── Input validation ──
    if (!problem || typeof problem !== 'string') {
      return NextResponse.json({ error: 'problem is required (string)' }, { status: 400 })
    }
    if (problem.length > 10000) {
      return NextResponse.json({ error: 'problem too long (max 10000 chars)' }, { status: 400 })
    }

    const config = normalizeConfig(providerConfig)
    const outputs = outputTypes && Array.isArray(outputTypes) ? outputTypes : (['strategy'] as OutputType[])
    const maxIter = Math.min(Math.max(maxIterations ?? 2, 1), 3) // clamp 1-3
    const threshold = qualityThreshold ?? 80

    // ── Rate limit check (shared key only) ──
    // Profile ID is preferred (set by the dashboard on first run). If absent
    // (e.g. third-party API caller), fall back to IP so anonymous callers
    // share the daily quota instead of getting unlimited access.
    const profileId = req.headers.get('x-hubforge-profile-id')
      || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'anon'
    const rateLimit = checkRateLimit(profileId, config.provider)
    if (!rateLimit.allowed) {
      return NextResponse.json({
        error: 'Daily strategy limit reached',
        used: rateLimit.used,
        limit: rateLimit.limit,
        resetsAt: rateLimit.resetsAt,
        hint: 'Add your own API key (providerConfig.apiKey) for unlimited access, or try again tomorrow.',
      }, { status: 429 })
    }

    // ── Run the 9-engine pipeline ──
    // Load the merged knowledge pack (built-in + admin overrides) once.
    const pack = await getMergedPack()

    // 1. Supervisor
    const decomposition = await supervisorEngine(config, problem, pack)

    // 2. Retrieval
    const retrieval = retrievalEngine(problem, decomposition, pack)

    // 3. Rule checks
    const ruleChecks = ruleEngine(problem, pack, decomposition)

    // 4-8. Iterative loop: Reasoning → Critique → Improvement → Evaluation
    let priorDraft: string | null = null
    let priorCritique: string | null = null
    let finalDraft = ''
    let finalScore = 0
    let thresholdMet = false
    let iterations = 0

    for (let iter = 1; iter <= maxIter; iter++) {
      iterations = iter
      const draft = await reasoningEngine(
        config, problem, decomposition, retrieval, priorCritique, priorDraft,
        pack, iter, maxIter, outputs, {}, undefined, undefined, undefined
      )
      const critique = await critiqueEngine(config, draft, pack)
      const improved = await improvementEngine(config, draft, critique, pack)
      const evaluation = await evaluationEngine(config, improved, pack, threshold)

      finalDraft = improved
      finalScore = evaluation.overall
      thresholdMet = evaluation.thresholdMet
      priorDraft = improved
      priorCritique = critique.issues.map((i: any) => `[${i.severity}] (${i.heuristic}) ${i.description}`).join('\n')

      if (evaluation.thresholdMet) break
    }

    // 9. Structure (ToC + Logframe)
    let structured: any = {}
    if (outputs.includes('toc') || outputs.includes('logframe')) {
      structured = await structureEngine(config, finalDraft, outputs)
    }

    // Record the generation for rate limiting (only shared key users).
    recordStrategyGeneration(profileId, config.provider)
    const durationMs = Date.now() - start

    return NextResponse.json({
      strategy: finalDraft,
      evaluation: { overall: finalScore, thresholdMet, iterations },
      structured: {
        toc: structured.toc ?? null,
        logframe: structured.logframe ?? null,
      },
      decomposition: {
        problemStatement: decomposition.problemStatement,
        objectives: decomposition.objectives,
        scope: decomposition.scope,
        stakeholders: decomposition.stakeholders,
        suggestedFrameworks: decomposition.suggestedFrameworks,
      },
      retrieval: {
        frameworks: retrieval.frameworks.map((f: any) => f.name),
        evidence: retrieval.evidence.map((e: any) => e.title),
      },
      ruleChecks,
      provider: describeProvider(config),
      durationMs,
      rateLimit: {
        used: rateLimit.used + (config.provider === 'zai' ? 1 : 0),
        limit: rateLimit.limit,
        remaining: rateLimit.isOwnKey ? Infinity : Math.max(0, rateLimit.limit - rateLimit.used - 1),
      },
    })
  } catch (e: any) {
    // Information disclosure: don't leak the raw error to the client.
    // Log the full error server-side, return a generic message client-side.
    console.error('[/api/v1/reason] error:', e)
    const isClientError = e instanceof SyntaxError // JSON.parse on bad body
    return NextResponse.json({
      error: isClientError ? 'Invalid request body' : 'Internal error',
      durationMs: Date.now() - start,
    }, { status: isClientError ? 400 : 500 })
  }
}
