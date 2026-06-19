// POST /api/feedback - incorporate user feedback
import { NextRequest, NextResponse } from 'next/server'
import { feedbackEngine, evaluationEngine, structureEngine, socialImpactPack, normalizeConfig, type ProviderConfig, type OutputType } from '@/lib/engine-access'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { currentDraft, feedback, outputTypes, providerConfig } = body as { currentDraft: string; feedback: string; outputTypes: OutputType[]; providerConfig?: ProviderConfig }
    if (!currentDraft || !feedback) return NextResponse.json({ error: 'currentDraft and feedback are required' }, { status: 400 })
    if (feedback.length > 5000) return NextResponse.json({ error: 'feedback too long (max 5000 chars)' }, { status: 400 })
    const config = normalizeConfig(providerConfig)
    const { improved, feedbackAddressed } = await feedbackEngine(config, currentDraft, feedback, socialImpactPack)
    const evaluation = await evaluationEngine(config, improved, socialImpactPack, 80)
    const structured = await structureEngine(config, improved, outputTypes)
    return NextResponse.json({ improved, addressed: feedbackAddressed, evaluation, structured })
  } catch (e: any) {
    console.error('[/api/feedback] error:', e)
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 })
  }
}
