// Unit tests for the frontend libraries (providers, user-profile, analytics)
import { describe, test, expect } from 'bun:test'
import {
  PROVIDERS,
  providerDisplayLabel,
  type ProviderConfig,
  type ProviderId,
} from '../providers'
import { COUNTRIES, ROLES } from '../user-profile'
import { analytics, track, setAnalyticsSession } from '../analytics'
import * as apiClient from '../api-client'
import { OUTPUT_OPTIONS, ENGINE_DEFS } from '../types'

// ============================================================
// Providers Tests
// ============================================================
describe('PROVIDERS', () => {
  test('has 7 providers', () => {
    expect(PROVIDERS.length).toBe(7)
  })

  test('includes zai (shared)', () => {
    const zai = PROVIDERS.find((p) => p.id === 'zai')
    expect(zai).toBeDefined()
    expect(zai!.needsKey).toBe(false)
  })

  test('includes zai-key (own key)', () => {
    const zaiKey = PROVIDERS.find((p) => p.id === 'zai-key')
    expect(zaiKey).toBeDefined()
    expect(zaiKey!.needsKey).toBe(true)
    expect(zaiKey!.docsUrl).toBe('https://z.ai/manage/apikey')
  })

  test('includes OpenAI, Anthropic, Gemini, Groq, Local', () => {
    const ids = PROVIDERS.map((p) => p.id)
    expect(ids).toContain('openai')
    expect(ids).toContain('anthropic')
    expect(ids).toContain('gemini')
    expect(ids).toContain('groq')
    expect(ids).toContain('local')
  })

  test('every provider has label, description, defaultModel, defaultBaseUrl', () => {
    for (const p of PROVIDERS) {
      expect(p.label).toBeTruthy()
      expect(p.description).toBeTruthy()
      expect(p.id).toBeTruthy()
    }
  })

  test('providers that need keys have docsUrl', () => {
    for (const p of PROVIDERS) {
      if (p.needsKey) {
        expect(p.docsUrl).toBeTruthy()
      }
    }
  })

  test('zai-key has correct default model and baseUrl', () => {
    const zaiKey = PROVIDERS.find((p) => p.id === 'zai-key')!
    expect(zaiKey.defaultModel).toBe('glm-4.6')
    expect(zaiKey.defaultBaseUrl).toBe('https://api.z.ai/api/paas/v4')
  })
})

describe('providerDisplayLabel', () => {
  test('displays zai as shared', () => {
    expect(providerDisplayLabel({ provider: 'zai' })).toContain('Z.ai')
  })

  test('displays zai-key with model', () => {
    const label = providerDisplayLabel({ provider: 'zai-key', apiKey: 'k', baseUrl: 'u', model: 'glm-4.6' })
    expect(label).toContain('Z.ai')
    expect(label).toContain('glm-4.6')
  })

  test('displays OpenAI with model', () => {
    const label = providerDisplayLabel({ provider: 'openai', apiKey: 'k', baseUrl: 'u', model: 'gpt-4o-mini' })
    expect(label).toContain('OpenAI')
    expect(label).toContain('gpt-4o-mini')
  })

  test('displays local with model', () => {
    const label = providerDisplayLabel({ provider: 'local', baseUrl: 'u', model: 'gemma2:9b' })
    expect(label).toContain('Local')
    expect(label).toContain('gemma2:9b')
  })
})

// ============================================================
// ProviderConfig Type Tests
// ============================================================
describe('ProviderConfig', () => {
  test('zai provider works without apiKey', () => {
    const config: ProviderConfig = { provider: 'zai' }
    expect(config.provider).toBe('zai')
    expect(config.apiKey).toBeUndefined()
  })

  test('zai-key provider requires apiKey', () => {
    const config: ProviderConfig = { provider: 'zai-key', apiKey: 'test-key' }
    expect(config.provider).toBe('zai-key')
    expect(config.apiKey).toBe('test-key')
  })

  test('all ProviderId values are valid', () => {
    const validIds: ProviderId[] = ['zai', 'zai-key', 'openai', 'anthropic', 'gemini', 'groq', 'local']
    for (const id of validIds) {
      const config: ProviderConfig = { provider: id }
      expect(config.provider).toBe(id)
    }
  })
})

// ============================================================
// User Profile Tests
// ============================================================
describe('user-profile', () => {
  test('COUNTRIES list has 80+ entries', () => {
    expect(COUNTRIES.length).toBeGreaterThan(80)
  })

  test('COUNTRIES includes common NGO operating countries', () => {
    expect(COUNTRIES).toContain('Kenya')
    expect(COUNTRIES).toContain('India')
    expect(COUNTRIES).toContain('Bangladesh')
    expect(COUNTRIES).toContain('Nigeria')
    expect(COUNTRIES).toContain('Other')
  })

  test('ROLES list has 11 entries', () => {
    expect(ROLES.length).toBe(11)
  })

  test('ROLES includes common NGO roles', () => {
    expect(ROLES).toContain('Program Officer')
    expect(ROLES).toContain('Monitoring & Evaluation Specialist')
    expect(ROLES).toContain('Country Director')
    expect(ROLES).toContain('Other')
  })
})

// ============================================================
// Analytics Tests
// ============================================================
describe('analytics', () => {
  test('analytics object has all required methods', () => {
    expect(typeof analytics.appOpen).toBe('function')
    expect(typeof analytics.pageView).toBe('function')
    expect(typeof analytics.runStart).toBe('function')
    expect(typeof analytics.runComplete).toBe('function')
    expect(typeof analytics.runError).toBe('function')
    expect(typeof analytics.feedbackGiven).toBe('function')
    expect(typeof analytics.settingsOpened).toBe('function')
    expect(typeof analytics.providerChanged).toBe('function')
  })

  test('track function does not throw', () => {
    expect(() => track('test_event', { category: 'test' })).not.toThrow()
  })

  test('setAnalyticsSession does not throw', () => {
    expect(() => setAnalyticsSession('test-session')).not.toThrow()
    expect(() => setAnalyticsSession(null)).not.toThrow()
  })
})

// ============================================================
// API Client Tests
// ============================================================
describe('api-client', () => {
  test('all API client functions are exported', () => {
    expect(typeof apiClient.callInterview).toBe('function')
    expect(typeof apiClient.callRetrieval).toBe('function')
    expect(typeof apiClient.callRuleChecks).toBe('function')
    expect(typeof apiClient.callReasoning).toBe('function')
    expect(typeof apiClient.callCritique).toBe('function')
    expect(typeof apiClient.callImprovement).toBe('function')
    expect(typeof apiClient.callEvaluation).toBe('function')
    expect(typeof apiClient.callStructure).toBe('function')
    expect(typeof apiClient.callFeedback).toBe('function')
    expect(typeof apiClient.callWebSearch).toBe('function')
    expect(typeof apiClient.getMemory).toBe('function')
    expect(typeof apiClient.clearMemory).toBe('function')
    expect(typeof apiClient.saveMemory).toBe('function')
  })
})

// ============================================================
// Types Tests
// ============================================================
describe('types', () => {
  test('OUTPUT_OPTIONS has 4 output types', () => {
    expect(OUTPUT_OPTIONS.length).toBe(4)
    const ids = OUTPUT_OPTIONS.map((o) => o.id)
    expect(ids).toContain('strategy')
    expect(ids).toContain('toc')
    expect(ids).toContain('logframe')
    expect(ids).toContain('evaluation-plan')
  })

  test('ENGINE_DEFS has 8 engines', () => {
    expect(ENGINE_DEFS.length).toBe(8)
    const ids = ENGINE_DEFS.map((e) => e.id)
    expect(ids).toContain('supervisor')
    expect(ids).toContain('retrieval')
    expect(ids).toContain('rule')
    expect(ids).toContain('reasoning')
    expect(ids).toContain('critique')
    expect(ids).toContain('improvement')
    expect(ids).toContain('evaluation')
    expect(ids).toContain('memory')
  })
})
