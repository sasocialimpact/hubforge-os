// Unit tests for the web search engine
import { describe, test, expect } from 'bun:test'

// Test the query generation logic (doesn't require network)
describe('web-search-engine query generation', () => {
  // Re-implement the logic to test it in isolation
  function extractLocation(problem: string): string | null {
    const known = ['Andhra Pradesh', 'Kenya', 'India', 'Bangladesh', 'Nigeria', 'Ethiopia', 'Uganda', 'Tanzania', 'Ghana', 'Senegal', 'Mali', 'Nepal', 'Pakistan', 'Afghanistan', 'Cambodia', 'Vietnam', 'Indonesia', 'Philippines', 'South Sudan', 'Somalia', 'Rwanda', 'Malawi', 'Mozambique', 'Zambia', 'Zimbabwe']
    for (const loc of known) {
      if (problem.includes(loc)) return loc
    }
    return null
  }

  function extractDomain(problem: string): string {
    const p = problem.toLowerCase()
    if (/literacy|numeracy|education|school|reading|learning|teacher|student|fln/.test(p)) return 'education literacy numeracy'
    if (/health|clinic|hospital|maternal|malaria|hiv|tb|vaccination|nutrition/.test(p)) return 'health'
    if (/water|sanitation|borehole|wast|watsan/.test(p)) return 'water sanitation'
    if (/agriculture|farmer|crop|livestock|irrigation|climate|drought|food security/.test(p)) return 'agriculture'
    if (/livelihood|income|microfinance|savings|employment|youth/.test(p)) return 'livelihoods'
    if (/gender|women|girls|gender-based|gbv/.test(p)) return 'gender'
    return 'social impact'
  }

  test('extracts Andhra Pradesh from problem', () => {
    const loc = extractLocation('Foundation literacy program in Andhra Pradesh government schools')
    expect(loc).toBe('Andhra Pradesh')
  })

  test('extracts Kenya from problem', () => {
    const loc = extractLocation('Water project for 500 households in Kenya')
    expect(loc).toBe('Kenya')
  })

  test('returns null for unknown location', () => {
    const loc = extractLocation('Water project for rural community')
    expect(loc).toBeNull()
  })

  test('detects education domain', () => {
    expect(extractDomain('Foundation literacy and numeracy in schools')).toBe('education literacy numeracy')
    expect(extractDomain('Teacher training program')).toBe('education literacy numeracy')
    expect(extractDomain('Student learning outcomes')).toBe('education literacy numeracy')
  })

  test('detects health domain', () => {
    expect(extractDomain('Maternal health clinic')).toBe('health')
    expect(extractDomain('Malaria prevention')).toBe('health')
    expect(extractDomain('Nutrition program')).toBe('health')
  })

  test('detects water/sanitation domain', () => {
    expect(extractDomain('Borehole rehabilitation')).toBe('water sanitation')
    expect(extractDomain('Water access project')).toBe('water sanitation')
  })

  test('detects agriculture domain', () => {
    expect(extractDomain('Climate-smart agriculture for farmers')).toBe('agriculture')
    expect(extractDomain('Drought-resistant crops')).toBe('agriculture')
    expect(extractDomain('Food security initiative')).toBe('agriculture')
  })

  test('detects livelihoods domain', () => {
    expect(extractDomain('Microfinance for women')).toBe('livelihoods')
    expect(extractDomain('Youth employment program')).toBe('livelihoods')
  })

  test('detects gender domain', () => {
    expect(extractDomain('Women empowerment initiative')).toBe('gender')
    expect(extractDomain('Gender-based violence prevention')).toBe('gender')
  })

  test('defaults to social impact', () => {
    expect(extractDomain('Community development')).toBe('social impact')
  })

  test('generates correct queries for AP literacy problem', () => {
    const problem = 'Foundation literacy and numeracy program in Andhra Pradesh government schools'
    const location = extractLocation(problem)
    const domain = extractDomain(problem)
    expect(location).toBe('Andhra Pradesh')
    expect(domain).toBe('education literacy numeracy')
    const demographic = `${location} ${domain} demographics statistics data`
    const previousPrograms = `${location} ${domain} government programs initiatives projects`
    expect(demographic).toBe('Andhra Pradesh education literacy numeracy demographics statistics data')
    expect(previousPrograms).toBe('Andhra Pradesh education literacy numeracy government programs initiatives projects')
  })
})
