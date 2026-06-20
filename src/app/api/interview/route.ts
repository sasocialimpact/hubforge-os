// POST /api/interview - Supervisor Engine: decompose problem, return questions
import { NextRequest, NextResponse } from 'next/server'
import { supervisorEngine, describeProvider, normalizeConfig, type ProviderConfig } from '@/lib/engine-access'
import { getMergedPack } from '@/lib/knowledge-overrides'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { problem, providerConfig } = body as { problem: string; providerConfig?: ProviderConfig }
    if (!problem || typeof problem !== 'string') {
      return NextResponse.json({ error: 'problem is required' }, { status: 400 })
    }
    if (problem.length > 10000) {
      return NextResponse.json({ error: 'problem too long (max 10000 chars)' }, { status: 400 })
    }
    const config = normalizeConfig(providerConfig)
    const pack = await getMergedPack()
    const decomposition = await supervisorEngine(config, problem, pack)
    return NextResponse.json({
      decomposition: {
        problemStatement: decomposition.problemStatement,
        objectives: decomposition.objectives,
        scope: decomposition.scope,
        stakeholders: decomposition.stakeholders,
        keyConsiderations: decomposition.keyConsiderations,
        suggestedFrameworks: decomposition.suggestedFrameworks,
      },
      questions: decomposition.clarifyingQuestions ?? [],
      provider: describeProvider(config),
    })
  } catch (e: any) {
    console.error('[/api/interview] error:', e)
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 })
  }
}
