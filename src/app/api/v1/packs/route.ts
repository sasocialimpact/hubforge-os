// GET /api/v1/packs - List available domain packs.
// Currently only the Social Impact Pack exists. As the platform opens,
// third-party packs will appear here (the "app store" moment).
import { NextResponse } from 'next/server'

export const maxDuration = 10

// In the future, this will be a registry of all installed domain packs.
// For now, the Social Impact Pack is the only one.
const PACKS = [
  {
    id: 'social-impact',
    name: 'Social Impact Pack',
    version: '1.0.0',
    description: 'M&E frameworks for NGOs, foundations, and social impact organizations. Theory of Change, Logframe, Outcome Mapping, MSC, Impact Evaluation, Survey Design.',
    status: 'installed',
    knowledgeGraph: '/api/v1/knowledge',
    license: 'Apache-2.0',
  },
]

export async function GET() {
  return NextResponse.json({
    packs: PACKS,
    total: PACKS.length,
    note: 'Domain packs are open-format. Anyone can build one - see the Knowledge Graph Schema spec at /docs/schema.',
  })
}
