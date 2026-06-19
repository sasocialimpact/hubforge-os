// Web Search Engine - searches the live web for demographic data, previous programs,
// and evidence specific to the user's problem.
// Uses z-ai-web-dev-sdk's web_search function.

import ZAI from 'z-ai-web-dev-sdk'
import type { ProviderConfig } from './engines'
import { llm } from './engines'

export interface SearchResult {
  title: string
  url: string
  snippet: string
  source: string
}

export interface WebSearchResult {
  demographic: SearchResult[]
  previousPrograms: SearchResult[]
  evidence: SearchResult[]
  summary: string
}

let zaiInstance: any = null
async function getZAI() {
  if (!zaiInstance) zaiInstance = await ZAI.create()
  return zaiInstance
}

async function search(query: string, num = 5): Promise<SearchResult[]> {
  try {
    const zai = await getZAI()
    const results = await zai.functions.invoke('web_search', { query, num })
    if (!Array.isArray(results)) return []
    return results.slice(0, num).map((r: any) => ({
      title: r.name || '',
      url: r.url || '',
      snippet: r.snippet || '',
      source: r.host_name || '',
    }))
  } catch (e: any) {
    console.error('[WebSearch] error:', e?.message)
    return []
  }
}

// The Supervisor decomposes the problem; we use it to generate smart search queries.
export async function webSearchEngine(
  _config: ProviderConfig,
  problem: string,
  decomposition: any,
): Promise<WebSearchResult> {
  // Generate 3 search queries based on the problem and decomposition
  const queries = generateSearchQueries(problem, decomposition)

  // Run all 3 searches in parallel
  const [demographic, previousPrograms, evidence] = await Promise.all([
    search(queries.demographic, 5),
    search(queries.previousPrograms, 5),
    search(queries.evidence, 5),
  ])

  // Summarize the findings using LLM
  let summary = ''
  try {
    const allResults = [...demographic, ...previousPrograms, ...evidence]
    const context = allResults
      .slice(0, 12)
      .map((r, i) => `${i + 1}. ${r.title}\n   ${r.snippet}\n   Source: ${r.source}`)
      .join('\n\n')

    summary = await llm(
      _config,
      'You are a research assistant. Summarize web search results relevant to a social impact program. Be concise (3-5 sentences). Highlight key data points, previous programs, and evidence.',
      `Problem: ${problem}\n\nSearch results:\n${context}\n\nSummarize the key findings relevant to designing this program:`,
    )
  } catch {
    summary = 'Search completed but summary generation failed.'
  }

  return { demographic, previousPrograms, evidence, summary }
}

// Generate smart search queries from the problem and decomposition
function generateSearchQueries(problem: string, decomposition: any): {
  demographic: string
  previousPrograms: string
  evidence: string
} {
  // Extract location and domain from the problem
  const location = extractLocation(problem) || ''
  const domain = extractDomain(problem, decomposition) || 'social impact'

  return {
    demographic: `${location} ${domain} demographics statistics data`,
    previousPrograms: `${location} ${domain} government programs initiatives projects`,
    evidence: `${domain} intervention effectiveness evidence research evaluation ${location}`,
  }
}

function extractLocation(problem: string): string | null {
  // Common location indicators
  const locationPatterns = [
    /\b(in|at|for|across)\s+([A-Z][a-zA-Z\s,]+?)(?=[.,]|\s+with|\s+and\s+\d|$)/g,
  ]
  for (const pattern of locationPatterns) {
    const match = pattern.exec(problem)
    if (match && match[2]) return match[2].trim()
  }
  // Check for known country/region names
  const known = ['Andhra Pradesh', 'Kenya', 'India', 'Bangladesh', 'Nigeria', 'Ethiopia', 'Uganda', 'Tanzania', 'Ghana', 'Senegal', 'Mali', 'Nepal', 'Pakistan', 'Afghanistan', 'Cambodia', 'Vietnam', 'Indonesia', 'Philippines', 'South Sudan', 'Somalia', 'Rwanda', 'Malawi', 'Mozambique', 'Zambia', 'Zimbabwe']
  for (const loc of known) {
    if (problem.includes(loc)) return loc
  }
  return null
}

function extractDomain(problem: string, decomposition: any): string | null {
  const p = problem.toLowerCase()
  if (/literacy|numeracy|education|school|reading|learning|teacher|student|fln/.test(p)) return 'education literacy numeracy'
  if (/health|clinic|hospital|maternal|malaria|hiv|tb|vaccination|nutrition/.test(p)) return 'health'
  if (/water|sanitation|borehole|wast|watsan/.test(p)) return 'water sanitation'
  if (/agriculture|farmer|crop|livestock|irrigation|climate|drought|food security/.test(p)) return 'agriculture'
  if (/livelihood|income|microfinance|savings|employment|youth/.test(p)) return 'livelihoods'
  if (/gender|women|girls|gender-based|gbv/.test(p)) return 'gender'
  return 'social impact'
}
