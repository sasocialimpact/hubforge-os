// AI Provider configuration. Persisted to localStorage.
// Users can use the shared built-in Z.ai (free, limited) or bring their own API key.

export type ProviderId = 'zai' | 'zai-key' | 'openai' | 'anthropic' | 'gemini' | 'groq' | 'local'

export interface ProviderConfig {
  provider: ProviderId
  apiKey?: string
  baseUrl?: string
  model?: string
}

export interface ProviderMeta {
  id: ProviderId
  label: string
  description: string
  needsKey: boolean
  defaultModel: string
  defaultBaseUrl: string
  modelHint: string
  docsUrl: string
  badge?: string
  badgeColor?: string
}

export const PROVIDERS: ProviderMeta[] = [
  {
    id: 'zai',
    label: 'Z.ai (shared, free)',
    description: 'No setup needed. Uses a shared Z.ai account. Best for trying it out — may have usage limits.',
    needsKey: false,
    defaultModel: '',
    defaultBaseUrl: '',
    modelHint: 'auto',
    docsUrl: '',
    badge: 'GETTING STARTED',
    badgeColor: 'emerald',
  },
  {
    id: 'zai-key',
    label: 'Z.ai (your own key)',
    description: 'Get your own free Z.ai API key for unlimited use. Recommended for regular users.',
    needsKey: true,
    defaultModel: 'glm-4.6',
    defaultBaseUrl: 'https://api.z.ai/api/paas/v4',
    modelHint: 'glm-4.6, glm-4-plus, glm-4-air',
    docsUrl: 'https://z.ai/manage/apikey',
    badge: 'RECOMMENDED',
    badgeColor: 'amber',
  },
  {
    id: 'groq',
    label: 'Groq (free tier)',
    description: 'Llama 3.3, Gemma — very fast. Generous free tier. Get a key in 30 seconds.',
    needsKey: true,
    defaultModel: 'llama-3.3-70b-versatile',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    modelHint: 'llama-3.3-70b-versatile, gemma2-9b-it',
    docsUrl: 'https://console.groq.com/keys',
    badge: 'FREE TIER',
    badgeColor: 'emerald',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    description: 'GPT-4o, GPT-4o-mini, etc. Bring your own API key. Pay per use.',
    needsKey: true,
    defaultModel: 'gpt-4o-mini',
    defaultBaseUrl: 'https://api.openai.com/v1',
    modelHint: 'gpt-4o-mini, gpt-4o, gpt-4.1-mini',
    docsUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    description: 'Claude 3.5 Sonnet, Haiku, etc. Uses the OpenAI-compatible endpoint.',
    needsKey: true,
    defaultModel: 'claude-3-5-sonnet-20241022',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    modelHint: 'claude-3-5-sonnet-20241022, claude-3-5-haiku-20241022',
    docsUrl: 'https://console.anthropic.com/settings/keys',
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    description: 'Gemini 1.5 / 2.0 Flash and Pro. Free tier available.',
    needsKey: true,
    defaultModel: 'gemini-1.5-flash',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    modelHint: 'gemini-1.5-flash, gemini-2.0-flash, gemini-1.5-pro',
    docsUrl: 'https://aistudio.google.com/app/apikey',
  },
  {
    id: 'local',
    label: 'Local model (Ollama)',
    description: 'Run Gemma, GLM, Llama on your own computer. Free forever, fully private. No data leaves your machine.',
    needsKey: false,
    defaultModel: 'gemma2:9b',
    defaultBaseUrl: 'http://localhost:11434/v1',
    modelHint: 'gemma2:9b, glm4:9b, llama3.1:8b, qwen2.5:7b',
    docsUrl: 'https://ollama.com/download',
    badge: 'FREE FOREVER',
    badgeColor: 'emerald',
  },
]

const STORAGE_KEY = 'hubforge.providerConfig'

export function getStoredProviderConfig(): ProviderConfig {
  if (typeof window === 'undefined') return { provider: 'zai' }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed.provider === 'string') return parsed as ProviderConfig
    }
  } catch { /* ignore */ }
  return { provider: 'zai' }
}

export function storeProviderConfig(config: ProviderConfig): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch { /* ignore */ }
}

export function providerDisplayLabel(config: ProviderConfig): string {
  const meta = PROVIDERS.find((p) => p.id === config.provider)
  if (!meta) return config.provider
  if (config.provider === 'zai') return 'Z.ai (shared, free)'
  if (config.provider === 'zai-key') return `Z.ai · ${config.model || 'glm-4.6'}`
  if (config.provider === 'local') return `Local · ${config.model || meta.defaultModel}`
  const model = config.model || meta.defaultModel
  return `${meta.label} · ${model}`
}
