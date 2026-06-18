// POST /api/structure — extract ToC + Logframe
import { NextRequest, NextResponse } from 'next/server'
import { structureEngine, normalizeConfig, type ProviderConfig, type OutputType } from '@/lib/engine-access'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { finalDraft, outputTypes, providerConfig } = body as { finalDraft: string; outputTypes: OutputType[]; providerConfig?: ProviderConfig }
    if (!finalDraft) return NextResponse.json({ error: 'finalDraft is required' }, { status: 400 })
    const config = normalizeConfig(providerConfig)
    const structured = await structureEngine(config, finalDraft, outputTypes)
    return NextResponse.json({ toc: structured.toc ?? null, logframe: structured.logframe ?? null })
  } catch (e: any) {
    console.error('[/api/structure] error:', e)
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 })
  }
}
