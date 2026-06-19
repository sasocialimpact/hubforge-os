// POST /api/run-step - run one engine step
import { NextRequest, NextResponse } from 'next/server'
import {
  retrievalEngine, ruleEngine, reasoningEngine, critiqueEngine,
  improvementEngine, evaluationEngine, socialImpactPack,
  normalizeConfig, type ProviderConfig, type OutputType,
} from '@/lib/engine-access'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { step, problem, decomposition, retrieval, priorDraft, priorCritique, draft, improved, critique, iteration, maxIterations, outputTypes, answers, providerConfig, threshold } = body as any
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
        const result = await reasoningEngine(config, problem, decomposition, retrieval, priorCritique, priorDraft, socialImpactPack, iteration, maxIterations, outputTypes, answers, webSearch)
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
