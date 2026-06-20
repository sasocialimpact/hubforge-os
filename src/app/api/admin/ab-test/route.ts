// POST /api/admin/ab-test - run the same problem through 2 different prompt
// versions and return both outputs side-by-side with quality scores.
//
// Auth: requires HUBFORGE_ADMIN_KEY env var + ?admin_key=... matching it.
//
// Request body:
//   {
//     "problem": "Design a literacy program for 500 children in rural Kenya",
//     "versionA": "pv_xxx",        // prompt_versions.id
//     "versionB": "pv_yyy",        // prompt_versions.id (must be same engineId as A)
//     "outputTypes": ["strategy"], // optional, default ["strategy"]
//     "providerConfig": { "provider": "zai" }  // optional
//   }
//
// Response:
//   {
//     "resultA": {
//       versionId: "pv_xxx",
//       label: "...",
//       draft: "...",              // raw reasoning engine output
//       improved: "...",           // post-improvement draft
//       critique: { issues, summary },
//       evaluation: { overall, thresholdMet, scores, notes },
//       durationMs: 12345
//     },
//     "resultB": { ... same shape ... },
//     "winner": "A" | "B" | "tie" | null,   // null if either run errored
//     "scoreDelta": number,                  // resultB.overall - resultA.overall
//     "provider": "Z.ai (shared, free)",
//     "durationMs": 25000                    // total wall time
//   }
//
// The pipeline per version:
//   supervisor → retrieval → reasoning (1 iteration, with version's prompts)
//   → critique → improvement → evaluation
//
// Supervisor + retrieval are SHARED between both runs (same decomposition +
// same retrieved knowledge) so the only difference is the reasoning prompt.
// This isolates the prompt's effect on draft quality.
//
// After the test, both versions' rolling avg_score + run_count are updated
// via recordRun() so the version history table reflects the test results.
import { NextRequest, NextResponse } from 'next/server'
import {
  supervisorEngine, retrievalEngine, reasoningEngine,
  critiqueEngine, improvementEngine, evaluationEngine,
  normalizeConfig, describeProvider,
  type ProviderConfig, type OutputType, type ReasoningPromptOverride,
} from '@/lib/engine-access'
import { getMergedPack } from '@/lib/knowledge-overrides'
import { getVersion, recordRun } from '@/lib/server/prompt-store'

export const maxDuration = 180 // 3 minutes - two full pipelines run sequentially

function requireAdminKey(provided: string | null): boolean {
  const expected = process.env.HUBFORGE_ADMIN_KEY
  if (!expected) return false
  if (!provided) return false
  if (provided.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < provided.length; i++)
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i)
  return diff === 0
}

const MAX_PROBLEM_CHARS = 10000

interface AbTestResult {
  versionId: string
  label: string
  engineId: string
  draft: string
  improved: string
  critique: any
  evaluation: any
  durationMs: number
  error?: string
}

async function runOne(
  problem: string,
  versionId: string,
  pack: any,
  config: ProviderConfig,
  outputs: OutputType[],
  sharedDecomposition: any,
  sharedRetrieval: any,
): Promise<AbTestResult> {
  const start = Date.now()
  const version = await getVersion(versionId)
  if (!version) {
    return {
      versionId,
      label: '(not found)',
      engineId: '',
      draft: '',
      improved: '',
      critique: null,
      evaluation: null,
      durationMs: Date.now() - start,
      error: `Version ${versionId} not found`,
    }
  }

  try {
    const override: ReasoningPromptOverride = {
      systemPrompt: version.systemPrompt,
      userPromptTemplate: version.userPromptTemplate,
    }

    // 1. Reasoning with the version's prompts (1 iteration, no prior critique)
    const draft = await reasoningEngine(
      config, problem, sharedDecomposition, sharedRetrieval,
      null, null, pack, 1, 1, outputs,
      {}, undefined, undefined, undefined, override
    )

    // 2. Critique the draft
    const critique = await critiqueEngine(config, draft, pack)

    // 3. Improve the draft (address critique issues)
    const improved = await improvementEngine(config, draft, critique, pack)

    // 4. Evaluate the improved draft (this is the comparable score)
    const evaluation = await evaluationEngine(config, improved, pack, 80)

    const score = evaluation?.overall ?? 0
    // Update the version's rolling average so the version history reflects it.
    try { await recordRun(versionId, score) } catch {}

    return {
      versionId: version.id,
      label: version.label,
      engineId: version.engineId,
      draft,
      improved,
      critique,
      evaluation,
      durationMs: Date.now() - start,
    }
  } catch (e: any) {
    return {
      versionId: version.id,
      label: version.label,
      engineId: version.engineId,
      draft: '',
      improved: '',
      critique: null,
      evaluation: null,
      durationMs: Date.now() - start,
      error: e?.message ?? 'unknown error',
    }
  }
}

export async function POST(req: NextRequest) {
  const start = Date.now()
  try {
    const { searchParams } = new URL(req.url)
    if (!requireAdminKey(searchParams.get('admin_key'))) {
      return NextResponse.json({ error: 'Invalid or missing admin key' }, { status: 403 })
    }

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'invalid body' }, { status: 400 })
    }
    const { problem, versionA, versionB } = body as {
      problem: string
      versionA: string
      versionB: string
    }
    if (!problem || typeof problem !== 'string') {
      return NextResponse.json({ error: 'problem is required (string)' }, { status: 400 })
    }
    if (problem.length > MAX_PROBLEM_CHARS) {
      return NextResponse.json({ error: `problem too long (max ${MAX_PROBLEM_CHARS} chars)` }, { status: 400 })
    }
    if (!versionA || !versionB) {
      return NextResponse.json({ error: 'versionA and versionB are required' }, { status: 400 })
    }
    if (versionA === versionB) {
      return NextResponse.json({ error: 'versionA and versionB must be different' }, { status: 400 })
    }

    // Load both versions up front so we can validate engineId match before
    // spending any LLM calls.
    const vA = await getVersion(versionA)
    const vB = await getVersion(versionB)
    if (!vA) return NextResponse.json({ error: `versionA (${versionA}) not found` }, { status: 404 })
    if (!vB) return NextResponse.json({ error: `versionB (${versionB}) not found` }, { status: 404 })
    if (vA.engineId !== vB.engineId) {
      return NextResponse.json(
        { error: `versionA engineId (${vA.engineId}) does not match versionB engineId (${vB.engineId}). A/B test must compare versions of the same engine.` },
        { status: 400 }
      )
    }

    const config = normalizeConfig(body.providerConfig)
    const outputs: OutputType[] = Array.isArray(body.outputTypes) && body.outputTypes.length > 0
      ? body.outputTypes
      : ['strategy']

    // Build shared context once - both runs use the same decomposition +
    // retrieved knowledge so the only difference is the reasoning prompt.
    const pack = await getMergedPack()
    const decomposition = await supervisorEngine(config, problem, pack)
    const retrieval = retrievalEngine(problem, decomposition, pack)

    // Run A and B sequentially. (Parallel would contend for the shared Z.ai
    // rate-limit slot and likely 429; sequential is slower but more reliable.)
    const resultA = await runOne(problem, versionA, pack, config, outputs, decomposition, retrieval)
    const resultB = await runOne(problem, versionB, pack, config, outputs, decomposition, retrieval)

    // Determine the winner by overall score (after improvement).
    let winner: 'A' | 'B' | 'tie' | null = null
    let scoreDelta = 0
    const scoreA = resultA.evaluation?.overall
    const scoreB = resultB.evaluation?.overall
    if (typeof scoreA === 'number' && typeof scoreB === 'number') {
      scoreDelta = scoreB - scoreA
      if (scoreA === scoreB) winner = 'tie'
      else winner = scoreA > scoreB ? 'A' : 'B'
    }

    return NextResponse.json({
      resultA,
      resultB,
      winner,
      scoreDelta,
      provider: describeProvider(config),
      durationMs: Date.now() - start,
    })
  } catch (e: any) {
    console.error('[/api/admin/ab-test POST] error:', e)
    return NextResponse.json(
      { error: e?.message ?? 'Internal error', durationMs: Date.now() - start },
      { status: 500 }
    )
  }
}
