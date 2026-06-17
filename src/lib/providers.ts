// AI Provider configuration. Persisted to localStorage.
// The user can choose Z.ai (built-in, no key) or bring their own provider.

export type ProviderId = 'zai' | 'openai' | 'anthropic' | 'gemini' | 'groq' | 'local'

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
}

export const PROVIDERS: ProviderMeta[] = [
  {
    id: 'zai',
    label: 'Z.ai (built-in)',
    description: 'No setup required. Uses the built-in Z.ai model. Best for getting started.',
    needsKey: false,
    defaultModel: '',
    defaultBaseUrl: '',
    modelHint: 'auto',
    docsUrl: '',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    description: 'GPT-4o, GPT-4o-mini, etc. Bring your own API key.',
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
    description: 'Gemini 1.5 / 2.0 Flash & Pro. Uses Google OpenAI-compatible endpoint.',
    needsKey: true,
    defaultModel: 'gemini-1.5-flash',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    modelHint: 'gemini-1.5-flash, gemini-2.0-flash, gemini-1.5-pro',
    docsUrl: 'https://aistudio.google.com/app/apikey',
  },
  {
    id: 'groq',
    label: 'Groq (fast inference)',
    description: 'Llama 3.3, Mixtral, Gemma — very fast. Free tier available.',
    needsKey: true,
    defaultModel: 'llama-3.3-70b-versatile',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    modelHint: 'llama-3.3-70b-versatile, gemma2-9b-it',
    docsUrl: 'https://console.groq.com/keys',
  },
  {
    id: 'local',
    label: 'Local model (Ollama / LM Studio)',
    description: 'Run Gemma, GLM, Llama, etc. on your own computer. No data leaves your machine. Requires a local OpenAI-compatible server.',
    needsKey: false,
    defaultModel: 'gemma2:9b',
    defaultBaseUrl: 'http://localhost:11434/v1',
    modelHint: 'gemma2:9b, glm4:9b, llama3.1:8b, qwen2.5:7b',
    docsUrl: 'https://ollama.com/download',
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
  if (config.provider === 'zai') return 'Z.ai (built-in)'
  const model = config.model || meta.defaultModel
  return `${meta.label} · ${model}`
}
