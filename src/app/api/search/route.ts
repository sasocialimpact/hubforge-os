// POST /api/search - Web Search Engine
// Searches for demographic data, previous programs, and evidence.
// Body: { problem, decomposition, providerConfig }
// Returns: { demographic, previousPrograms, evidence, summary }

import { NextRequest, NextResponse } from 'next/server'
import { webSearchEngine } from '@/lib/web-search-engine'
import type { ProviderConfig } from '@/lib/engine-access'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { problem, decomposition, providerConfig } = body as {
      problem: string
      decomposition: any
      providerConfig?: ProviderConfig
    }

    if (!problem) return NextResponse.json({ error: 'problem is required' }, { status: 400 })

    const result = await webSearchEngine(providerConfig || { provider: 'zai' }, problem, decomposition)
    return NextResponse.json(result)
  } catch (e: any) {
    console.error('[/api/search] error:', e)
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 })
  }
}
