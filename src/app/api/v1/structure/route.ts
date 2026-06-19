// POST /api/v1/structure - Extract Theory of Change + Logframe from a strategy document.
//
// Request:
//   {
//     "draft": "# Strategy Document\n...",
//     "outputTypes": ["toc", "logframe"],
//     "providerConfig": { "provider": "zai" }
//   }
//
// Response:
//   { "toc": {...}, "logframe": {...} }
import { NextRequest, NextResponse } from 'next/server'
import { structureEngine, normalizeConfig, type ProviderConfig, type OutputType } from '@/lib/engine-access'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { draft, outputTypes, providerConfig } = body as {
      draft: string
      outputTypes?: OutputType[]
      providerConfig?: ProviderConfig
    }
    if (!draft || typeof draft !== 'string') {
      return NextResponse.json({ error: 'draft is required (string)' }, { status: 400 })
    }
    if (draft.length > 50000) {
      return NextResponse.json({ error: 'draft too long (max 50000 chars)' }, { status: 400 })
    }
    const config = normalizeConfig(providerConfig)
    const outputs = outputTypes && Array.isArray(outputTypes) ? outputTypes : (['toc', 'logframe'] as OutputType[])
    const structured = await structureEngine(config, draft, outputs)
    return NextResponse.json({
      toc: structured.toc ?? null,
      logframe: structured.logframe ?? null,
    })
  } catch (e: any) {
    console.error('[/api/v1/structure] error:', e)
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 })
  }
}
