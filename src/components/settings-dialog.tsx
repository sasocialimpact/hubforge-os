'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Settings, Key, Cpu, Server, ExternalLink, Check, Eye, EyeOff } from 'lucide-react'
import { PROVIDERS, getStoredProviderConfig, storeProviderConfig, type ProviderConfig, type ProviderMeta } from '@/lib/providers'
import { cn } from '@/lib/utils'

const BADGE_STYLES: Record<string, string> = {
  emerald: 'bg-emerald-600 text-white',
  amber: 'bg-amber-600 text-white',
}

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: (config: ProviderConfig) => void
}

export function SettingsDialog({ open, onOpenChange, onSaved }: SettingsDialogProps) {
  const [config, setConfig] = useState<ProviderConfig>(() => getStoredProviderConfig())
  const [showKey, setShowKey] = useState(false)

  const selectedMeta = PROVIDERS.find((p) => p.id === config.provider)!

  const handleSelectProvider = (meta: ProviderMeta) => {
    setConfig({
      provider: meta.id,
      apiKey: meta.needsKey ? config.apiKey : '',
      baseUrl: meta.id === 'zai' ? '' : (config.baseUrl && config.baseUrl !== '' ? config.baseUrl : meta.defaultBaseUrl),
      model: meta.id === 'zai' ? '' : (config.model && config.model !== '' ? config.model : meta.defaultModel),
    })
  }

  const handleSave = () => {
    storeProviderConfig(config)
    onSaved?.(config)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 p-0">
        {/* Header - fixed */}
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4 text-amber-600" />
            AI provider
          </DialogTitle>
          <DialogDescription className="text-xs">
            Use the shared AI (free, may have limits) or add your own key for unlimited use.
          </DialogDescription>
        </DialogHeader>

        {/* Body - scrollable but not clipped */}
        <div className="overflow-y-auto px-5 py-4 max-h-[60vh]">
          {/* Provider list */}
          <Label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2 block">Choose provider</Label>
          <div className="space-y-1.5 mb-4">
            {PROVIDERS.map((meta) => {
              const selected = config.provider === meta.id
              return (
                <button
                  key={meta.id}
                  type="button"
                  onClick={() => handleSelectProvider(meta)}
                  className={cn(
                    'w-full text-left rounded-lg border px-3 py-2.5 transition-all flex items-center gap-2.5',
                    selected
                      ? 'border-amber-500 ring-1 ring-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20'
                      : 'border-border hover:border-amber-500/40 hover:bg-muted/30'
                  )}
                >
                  <div className={cn(
                    'h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center',
                    selected ? 'border-amber-500' : 'border-muted-foreground/30'
                  )}>
                    {selected && <div className="h-2 w-2 rounded-full bg-amber-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-medium">{meta.label}</span>
                      {meta.badge && (
                        <Badge className={cn('text-[8px] px-1 py-0 h-3.5', BADGE_STYLES[meta.badgeColor || 'amber'])}>
                          {meta.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight">{meta.description}</p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* API key + config fields - ALWAYS visible when a key-needing provider is selected */}
          {selectedMeta.id !== 'zai' && (
            <div className="space-y-3 rounded-lg border border-border p-3 bg-muted/20">
              {selectedMeta.needsKey && (
                <div className="space-y-1">
                  <Label htmlFor="api-key" className="text-[11px] flex items-center gap-1.5">
                    <Key className="h-3 w-3" /> API key
                    {selectedMeta.docsUrl && (
                      <a href={selectedMeta.docsUrl} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-0.5 text-[10px] text-amber-700 dark:text-amber-400 hover:underline">
                        <ExternalLink className="h-2.5 w-2.5" /> get key
                      </a>
                    )}
                  </Label>
                  <div className="relative">
                    <Input
                      id="api-key"
                      type={showKey ? 'text' : 'password'}
                      value={config.apiKey ?? ''}
                      onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                      placeholder="paste your API key here..."
                      className="font-mono text-sm pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(s => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  {selectedMeta.id === 'zai-key' && (
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
                      Get your free Z.ai API key at <strong>z.ai/manage/apikey</strong>. Sign up (free), create a key, paste it here.
                      Your key stays in your browser - never sent to HubForge servers.
                    </p>
                  )}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label htmlFor="model" className="text-[11px] flex items-center gap-1.5">
                    <Cpu className="h-3 w-3" /> Model
                  </Label>
                  <Input
                    id="model"
                    value={config.model ?? ''}
                    onChange={(e) => setConfig({ ...config, model: e.target.value })}
                    placeholder={selectedMeta.defaultModel}
                    className="font-mono text-sm h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="base-url" className="text-[11px] flex items-center gap-1.5">
                    <Server className="h-3 w-3" /> Base URL
                  </Label>
                  <Input
                    id="base-url"
                    value={config.baseUrl ?? ''}
                    onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                    placeholder={selectedMeta.defaultBaseUrl}
                    className="font-mono text-sm h-9"
                  />
                </div>
              </div>
              {selectedMeta.id === 'local' && (
                <p className="text-[10px] text-muted-foreground font-mono">
                  Ollama: localhost:11434 - LM Studio: localhost:1234
                </p>
              )}
            </div>
          )}

          {selectedMeta.id === 'zai' && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs flex items-start gap-2">
              <Check className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-300">Quick start (shared AI)</p>
                <p className="text-muted-foreground mt-0.5 text-[11px]">
                  This works immediately but may have usage limits. For unlimited use,
                  switch to <strong>"Z.ai (your own key)"</strong> above and paste a free API key from z.ai.
                </p>
              </div>
            </div>
          )}

          <p className="mt-3 text-[10px] text-muted-foreground leading-relaxed">
            Your key stays in this browser (localStorage). It's sent directly to your chosen provider - never to HubForge OS servers.
          </p>
        </div>

        {/* Footer - fixed */}
        <DialogFooter className="px-5 py-3 border-t border-border shrink-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSave} className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5">
            <Check className="h-3.5 w-3.5" /> Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
