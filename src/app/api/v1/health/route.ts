// GET /api/v1/health — Public API health check.
// No auth required. Returns API version + available endpoints.
import { NextResponse } from 'next/server'

export const maxDuration = 10

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    api: 'hubforge-os',
    version: 'v1',
    endpoints: [
      'POST /api/v1/reason — Run the 9-engine reasoning pipeline on a problem',
      'POST /api/v1/structure — Extract ToC + Logframe from a strategy document',
      'GET /api/v1/knowledge — List knowledge graph layers (frameworks, rules, evidence)',
      'GET /api/v1/packs — List available domain packs',
      'GET /api/v1/health — This endpoint',
    ],
    docs: 'https://hubforge-os.dev/api',
    license: 'Apache-2.0',
  })
}
