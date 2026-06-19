// POST /api/run-step - run one engine step
import { NextRequest, NextResponse } from 'next/server'
import {
  retrievalEngine, ruleEngine, reasoningEngine, critiqueEngine,
  improvementEngine, evaluationEngine, socialImpactPack,
  normalizeConfig, type ProviderConfig, type OutputType,
} from '@/lib/engine-access'

export const maxDuration = 60

const MAX_DRAFT = 50000
const MAX_CRITIQUE = 50000
const MAX_PROBLEM = 10000

// Steps that take `problem` as their primary input.
const PROBLEM_STEPS = new Set(['retrieval', 'rule', 'reasoning'])
// Steps that take a draft/critique/improved instead — they don't need `problem`.
const DRAFT_STEPS = new Set(['critique', 'improvement', 'evaluation'])

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { step, problem, decomposition, retrieval, priorDraft, priorCritique, draft, improved, critique, iteration, maxIterations, outputTypes, answers, providerConfig, threshold } = body as any

    // Input validation — step-specific so critique/improvement/evaluation
    // (which operate on a draft, not the original problem) don't fail with
    // "problem is required".
    if (!step || typeof step !== 'string') return NextResponse.json({ error: 'step is required' }, { status: 400 })
    if (step.length > 50 || !/^[a-z]+$/.test(step)) return NextResponse.json({ error: 'invalid step' }, { status: 400 })
    if (!PROBLEM_STEPS.has(step) && !DRAFT_STEPS.has(step)) {
      return NextResponse.json({ error: `unknown step: ${step}` }, { status: 400 })
    }
    if (PROBLEM_STEPS.has(step)) {
      if (!problem || typeof problem !== 'string') return NextResponse.json({ error: 'problem is required' }, { status: 400 })
      if (problem.length > MAX_PROBLEM) return NextResponse.json({ error: `problem too long (max ${MAX_PROBLEM} chars)` }, { status: 400 })
    }
    if (step === 'critique') {
      if (!draft || typeof draft !== 'string') return NextResponse.json({ error: 'draft is required for critique' }, { status: 400 })
      if (draft.length > MAX_DRAFT) return NextResponse.json({ error: `draft too long (max ${MAX_DRAFT} chars)` }, { status: 400 })
    }
    if (step === 'improvement') {
      if (!draft || typeof draft !== 'string') return NextResponse.json({ error: 'draft is required for improvement' }, { status: 400 })
      if (draft.length > MAX_DRAFT) return NextResponse.json({ error: `draft too long (max ${MAX_DRAFT} chars)` }, { status: 400 })
      if (!critique) return NextResponse.json({ error: 'critique is required for improvement' }, { status: 400 })
      if (typeof critique === 'string' && critique.length > MAX_CRITIQUE) return NextResponse.json({ error: `critique too long (max ${MAX_CRITIQUE} chars)` }, { status: 400 })
    }
    if (step === 'evaluation') {
      if (!improved || typeof improved !== 'string') return NextResponse.json({ error: 'improved is required for evaluation' }, { status: 400 })
      if (improved.length > MAX_DRAFT) return NextResponse.json({ error: `improved too long (max ${MAX_DRAFT} chars)` }, { status: 400 })
    }

    const config = normalizeConfig(providerConfig)
    const qualThreshold = threshold ?? 80

    switch (step) {
      case 'retrieval': {
        const result = retrievalEngine(problem, decomposition, socialImpactPack)
        return NextResponse.json({ output: {
          frameworks: result.frameworks.map((f: any) => ({ name: f.name, description: f.description, whenToUse: f.whenToUse, keyElements: f.keyElements, template: f.template })),
          decisionRules: result.decisionRules.map((r: any) => ({ name: r.name, check: r.check, passCondition: r.passCondition, failAction: r.failAction })),
          evidence: result.evidence.map((e: any) => ({ title: e.title, type: e.type, summary: e.summary })),
          historicalMemory: result.historicalMemory,
          reasoningPatterns: result.reasoningPatterns.map((p: any) => ({ name: p.name, description: p.description })),
          improvementHeuristics: result.improvementHeuristics.map((h: any) => ({ name: h.name, description: h.description })),
        } })
      }
      case 'rule': {
        return NextResponse.json({ output: ruleEngine(problem, socialImpactPack) })
      }
      case 'reasoning': {
        const webSearch = body.webSearch // optional web search results
        const orgContext = body.orgContext // optional organization context string
        const contextBlocks = body.contextBlocks // optional context blocks string
        const result = await reasoningEngine(config, problem, decomposition, retrieval, priorCritique, priorDraft, socialImpactPack, iteration, maxIterations, outputTypes, answers, webSearch, orgContext, contextBlocks)
        return NextResponse.json({ output: result })
      }
      case 'critique': {
        const result = await critiqueEngine(config, draft, socialImpactPack)
        return NextResponse.json({ output: result })
      }
      case 'improvement': {
        const result = await improvementEngine(config, draft, critique, socialImpactPack)
        return NextResponse.json({ output: result })
      }
      case 'evaluation': {
        const result = await evaluationEngine(config, improved, socialImpactPack, qualThreshold)
        return NextResponse.json({ output: result })
      }
      default:
        return NextResponse.json({ error: `unknown step: ${step}` }, { status: 400 })
    }
  } catch (e: any) {
    console.error('[/api/run-step] error:', e)
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 })
  }
}
