// Unit tests for the reasoning engines and API client logic.
// Run with: bun test
import { describe, test, expect } from 'bun:test'
import { socialImpactPack } from '../knowledge'
import {
  normalizeConfig,
  describeProvider,
  retrievalEngine,
  ruleEngine,
  extractJSON,
  type ProviderConfig,
} from '../engines'

// ============================================================
// Provider Config Tests
// ============================================================
describe('normalizeConfig', () => {
  test('defaults to zai when no config provided', () => {
    const c = normalizeConfig(undefined)
    expect(c.provider).toBe('zai')
  })

  test('returns zai config as-is (no baseUrl/model needed)', () => {
    const c = normalizeConfig({ provider: 'zai' })
    expect(c.provider).toBe('zai')
    expect(c.baseUrl).toBeUndefined()
    expect(c.model).toBeUndefined()
  })

  test('fills defaults for OpenAI', () => {
    const c = normalizeConfig({ provider: 'openai', apiKey: 'sk-test' })
    expect(c.provider).toBe('openai')
    expect(c.baseUrl).toBe('https://api.openai.com/v1')
    expect(c.model).toBe('gpt-4o-mini')
    expect(c.apiKey).toBe('sk-test')
  })

  test('fills defaults for zai-key', () => {
    const c = normalizeConfig({ provider: 'zai-key', apiKey: 'test-key' })
    expect(c.provider).toBe('zai-key')
    expect(c.baseUrl).toBe('https://api.z.ai/api/paas/v4')
    expect(c.model).toBe('glm-4.6')
    expect(c.apiKey).toBe('test-key')
  })

  test('fills defaults for Groq', () => {
    const c = normalizeConfig({ provider: 'groq', apiKey: 'gq-test' })
    expect(c.provider).toBe('groq')
    expect(c.baseUrl).toBe('https://api.groq.com/openai/v1')
    expect(c.model).toBe('llama-3.3-70b-versatile')
  })

  test('fills defaults for local (Ollama)', () => {
    const c = normalizeConfig({ provider: 'local' })
    expect(c.provider).toBe('local')
    expect(c.baseUrl).toBe('http://localhost:11434/v1')
    expect(c.model).toBe('gemma2:9b')
  })

  test('preserves custom baseUrl and model', () => {
    const c = normalizeConfig({
      provider: 'openai',
      apiKey: 'sk-test',
      baseUrl: 'https://custom.api.com/v1',
      model: 'gpt-4-turbo',
    })
    expect(c.baseUrl).toBe('https://custom.api.com/v1')
    expect(c.model).toBe('gpt-4-turbo')
  })

  test('trims whitespace from apiKey, baseUrl, model', () => {
    const c = normalizeConfig({
      provider: 'openai',
      apiKey: '  sk-test  ',
      baseUrl: '  https://api.openai.com/v1  ',
      model: '  gpt-4o-mini  ',
    })
    expect(c.apiKey).toBe('sk-test')
    expect(c.baseUrl).toBe('https://api.openai.com/v1')
    expect(c.model).toBe('gpt-4o-mini')
  })
})

describe('describeProvider', () => {
  test('describes shared zai', () => {
    expect(describeProvider({ provider: 'zai' })).toBe('Z.ai (shared, free)')
  })

  test('describes zai-key with model', () => {
    const d = describeProvider({ provider: 'zai-key', apiKey: 'k', baseUrl: 'https://api.z.ai/api/paas/v4', model: 'glm-4.6' })
    expect(d).toContain('Z.ai')
    expect(d).toContain('glm-4.6')
  })

  test('describes OpenAI with model and baseUrl', () => {
    const d = describeProvider({ provider: 'openai', apiKey: 'k', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' })
    expect(d).toContain('OpenAI')
    expect(d).toContain('gpt-4o-mini')
  })
})

// ============================================================
// Retrieval Engine Tests
// ============================================================
describe('retrievalEngine', () => {
  const mockDecomposition = {
    problemStatement: 'Test',
    objectives: [],
    scope: '',
    stakeholders: [],
    keyConsiderations: [],
    suggestedFrameworks: ['Theory of Change', 'Logical Framework Analysis (Logframe)'],
  }

  test('returns frameworks from the pack', () => {
    const result = retrievalEngine('test problem', mockDecomposition as any, socialImpactPack)
    expect(result.frameworks.length).toBeGreaterThan(0)
    expect(result.frameworks.some((f) => f.name.includes('Theory of Change'))).toBe(true)
  })

  test('returns decision rules', () => {
    const result = retrievalEngine('test problem', mockDecomposition as any, socialImpactPack)
    expect(result.decisionRules.length).toBe(7)
    expect(result.decisionRules.some((r) => r.name === 'SMART Goal Validation')).toBe(true)
  })

  test('returns evidence sources', () => {
    const result = retrievalEngine('test problem', mockDecomposition as any, socialImpactPack)
    expect(result.evidence.length).toBe(11)
    expect(result.evidence.some((e) => e.title.includes('OECD-DAC'))).toBe(true)
  })

  test('returns historical memory', () => {
    const result = retrievalEngine('test problem', mockDecomposition as any, socialImpactPack)
    expect(result.historicalMemory.length).toBe(8)
  })

  test('returns reasoning patterns', () => {
    const result = retrievalEngine('test problem', mockDecomposition as any, socialImpactPack)
    expect(result.reasoningPatterns.length).toBe(6)
  })

  test('returns improvement heuristics', () => {
    const result = retrievalEngine('test problem', mockDecomposition as any, socialImpactPack)
    expect(result.improvementHeuristics.length).toBe(9)
  })

  test('filters frameworks by suggestedFrameworks when available', () => {
    const decompWithSuggestions = {
      ...mockDecomposition,
      suggestedFrameworks: ['Outcome Mapping'],
    }
    const result = retrievalEngine('test', decompWithSuggestions as any, socialImpactPack)
    expect(result.frameworks.length).toBe(1)
    expect(result.frameworks[0].name).toBe('Outcome Mapping')
  })

  test('falls back to first 3 frameworks when no suggestions match', () => {
    const decompWithBadSuggestions = {
      ...mockDecomposition,
      suggestedFrameworks: ['Nonexistent Framework'],
    }
    const result = retrievalEngine('test', decompWithBadSuggestions as any, socialImpactPack)
    expect(result.frameworks.length).toBe(3)
  })

  test('handles empty suggestedFrameworks', () => {
    const decompEmpty = { ...mockDecomposition, suggestedFrameworks: [] }
    const result = retrievalEngine('test', decompEmpty as any, socialImpactPack)
    expect(result.frameworks.length).toBe(3)
  })

  test('handles undefined suggestedFrameworks', () => {
    const decompUndefined = { ...mockDecomposition, suggestedFrameworks: undefined }
    const result = retrievalEngine('test', decompUndefined as any, socialImpactPack)
    expect(result.frameworks.length).toBe(3)
  })
})

// ============================================================
// Rule Engine Tests
// ============================================================
describe('ruleEngine', () => {
  test('returns 7 rule checks', () => {
    const checks = ruleEngine('Design a water project for 500 households in Kenya', socialImpactPack)
    expect(checks.length).toBe(7)
  })

  test('SMART Goal Validation passes when measurable target present', () => {
    const checks = ruleEngine('Increase income by 25% by year 3', socialImpactPack)
    const smartCheck = checks.find((c) => c.rule === 'SMART Goal Validation')
    expect(smartCheck?.passed).toBe(true)
  })

  test('SMART Goal Validation fails when no measurable target', () => {
    const checks = ruleEngine('Improve livelihoods for farmers', socialImpactPack)
    const smartCheck = checks.find((c) => c.rule === 'SMART Goal Validation')
    expect(smartCheck?.passed).toBe(false)
  })

  test('Stakeholder Coverage passes when beneficiaries mentioned', () => {
    const checks = ruleEngine('Help farmers in rural communities', socialImpactPack)
    const stakeholderCheck = checks.find((c) => c.rule === 'Stakeholder Coverage')
    expect(stakeholderCheck?.passed).toBe(true)
  })

  test('Stakeholder Coverage fails when no stakeholders mentioned', () => {
    const checks = ruleEngine('Build infrastructure', socialImpactPack)
    const stakeholderCheck = checks.find((c) => c.rule === 'Stakeholder Coverage')
    expect(stakeholderCheck?.passed).toBe(false)
  })

  test('Risk Identification passes when risk language present', () => {
    const checks = ruleEngine('Design a program addressing climate risk and uncertainty', socialImpactPack)
    const riskCheck = checks.find((c) => c.rule === 'Risk Identification')
    expect(riskCheck?.passed).toBe(true)
  })

  test('Evidence Citation always fails for user problems', () => {
    const checks = ruleEngine('Any problem statement', socialImpactPack)
    const evidenceCheck = checks.find((c) => c.rule === 'Evidence Citation')
    expect(evidenceCheck?.passed).toBe(false)
  })

  test('every check has rule, passed, and note fields', () => {
    const checks = ruleEngine('test problem', socialImpactPack)
    for (const check of checks) {
      expect(check).toHaveProperty('rule')
      expect(check).toHaveProperty('passed')
      expect(check).toHaveProperty('note')
      expect(typeof check.passed).toBe('boolean')
    }
  })
})

// ============================================================
// JSON Extraction Tests
// ============================================================
describe('extractJSON', () => {
  test('extracts clean JSON object', () => {
    const result = extractJSON('{"name":"test","value":123}')
    expect(result).toEqual({ name: 'test', value: 123 })
  })

  test('extracts JSON from markdown fence', () => {
    const result = extractJSON('```json\n{"name":"test"}\n```')
    expect(result).toEqual({ name: 'test' })
  })

  test('extracts JSON from surrounding text', () => {
    const result = extractJSON('Here is the result:\n{"name":"test"}\nDone.')
    expect(result).toEqual({ name: 'test' })
  })

  test('extracts JSON array', () => {
    const result = extractJSON('[1, 2, 3]')
    expect(result).toEqual([1, 2, 3])
  })

  test('handles nested objects', () => {
    const result = extractJSON('{"a":{"b":{"c":1}}}')
    expect(result).toEqual({ a: { b: { c: 1 } } })
  })

  test('handles strings with braces', () => {
    const result = extractJSON('{"text":"hello {world}"}')
    expect(result).toEqual({ text: 'hello {world}' })
  })

  test('handles escaped quotes in strings', () => {
    const result = extractJSON('{"text":"say \\"hello\\""}')
    expect(result).toEqual({ text: 'say "hello"' })
  })

  test('returns null for empty input', () => {
    expect(extractJSON('')).toBeNull()
  })

  test('returns null for non-JSON text', () => {
    expect(extractJSON('This is just text')).toBeNull()
  })

  test('returns null for malformed JSON', () => {
    expect(extractJSON('{broken json}')).toBeNull()
  })
})

// ============================================================
// Knowledge Pack Tests
// ============================================================
describe('socialImpactPack', () => {
  test('has correct id and name', () => {
    expect(socialImpactPack.id).toBe('social-impact')
    expect(socialImpactPack.name).toBe('Social Impact Pack')
  })

  test('has 8 frameworks', () => {
    expect(socialImpactPack.frameworks.length).toBe(8)
  })

  test('has 7 decision rules', () => {
    expect(socialImpactPack.decisionRules.length).toBe(7)
  })

  test('has 11 evidence sources', () => {
    expect(socialImpactPack.evidence.length).toBe(11)
  })

  test('has 8 historical memory cases', () => {
    expect(socialImpactPack.historicalMemory.length).toBe(8)
  })

  test('has 6 reasoning patterns', () => {
    expect(socialImpactPack.reasoningPatterns.length).toBe(6)
  })

  test('has 9 improvement heuristics', () => {
    expect(socialImpactPack.improvementHeuristics.length).toBe(9)
  })

  test('has 7 evaluation criteria with weights summing to 1.0', () => {
    expect(socialImpactPack.evaluationCriteria.length).toBe(7)
    const totalWeight = socialImpactPack.evaluationCriteria.reduce((sum, c) => sum + c.weight, 0)
    expect(Math.abs(totalWeight - 1.0)).toBeLessThan(0.01)
  })

  test('every framework has name, description, whenToUse, keyElements', () => {
    for (const f of socialImpactPack.frameworks) {
      expect(f.name).toBeTruthy()
      expect(f.description).toBeTruthy()
      expect(f.whenToUse).toBeTruthy()
      expect(f.keyElements.length).toBeGreaterThan(0)
    }
  })

  test('every decision rule has name, check, passCondition, failAction', () => {
    for (const r of socialImpactPack.decisionRules) {
      expect(r.name).toBeTruthy()
      expect(r.check).toBeTruthy()
      expect(r.passCondition).toBeTruthy()
      expect(r.failAction).toBeTruthy()
    }
  })

  test('every historical memory case has problem, context, outcome, lesson', () => {
    for (const m of socialImpactPack.historicalMemory) {
      expect(m.problem).toBeTruthy()
      expect(m.context).toBeTruthy()
      expect(m.outcome).toBeTruthy()
      expect(m.lesson).toBeTruthy()
    }
  })
})
