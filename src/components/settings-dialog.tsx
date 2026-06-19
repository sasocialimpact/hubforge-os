'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Settings, Key, Cpu, Server, ExternalLink, Check } from 'lucide-react'
import { PROVIDERS, getStoredProviderConfig, storeProviderConfig, type ProviderConfig, type ProviderMeta } from '@/lib/providers'
import { cn } from '@/lib/utils'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: (config: ProviderConfig) => void
}

export function SettingsDialog({ open, onOpenChange, onSaved }: SettingsDialogProps) {
  const [config, setConfig] = useState<ProviderConfig>(() => getStoredProviderConfig())

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
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-amber-600" />
            AI provider settings
          </DialogTitle>
          <DialogDescription>
            Choose how HubForge OS powers its reasoning. The built-in Z.ai option needs no setup.
            For everything else, bring your own API key - or run a local model for full privacy.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-2 -mr-2">
          <div className="space-y-4">
            {/* Provider picker */}
            <div>
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Provider</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PROVIDERS.map((meta) => (
                  <button
                    key={meta.id}
                    type="button"
                    onClick={() => handleSelectProvider(meta)}
                    className={cn(
                      'text-left rounded-lg border p-3 transition-all',
                      config.provider === meta.id
                        ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-50 dark:bg-amber-950/30'
                        : 'border-border hover:border-amber-500/50'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-medium text-sm">{meta.label}</span>
                      {config.provider === meta.id && <Check className="h-4 w-4 text-amber-600" />}
                    </div>
                    <p className="text-xs text-muted-foreground leading-snug">{meta.description}</p>
                    {!meta.needsKey && meta.id !== 'zai' && (
                      <Badge variant="outline" className="mt-1.5 text-[9px] font-mono">no key needed</Badge>
                    )}
                    {meta.id === 'zai' && (
                      <Badge className="mt-1.5 bg-emerald-600 hover:bg-emerald-600 text-white text-[9px] font-mono">recommended</Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Config fields */}
            {selectedMeta.id !== 'zai' && (
              <div className="space-y-3 rounded-lg border border-border p-3 bg-muted/30">
                {selectedMeta.needsKey && (
                  <div className="space-y-1.5">
                    <Label htmlFor="api-key" className="text-xs flex items-center gap-1.5">
                      <Key className="h-3 w-3" /> API key
                    </Label>
                    <Input
                      id="api-key"
                      type="password"
                      value={config.apiKey ?? ''}
                      onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                      placeholder="sk-..."
                      className="font-mono text-sm"
                    />
                    {selectedMeta.docsUrl && (
                      <a href={selectedMeta.docsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400 hover:underline">
                        <ExternalLink className="h-3 w-3" /> Get an API key from {selectedMeta.label}
                      </a>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="model" className="text-xs flex items-center gap-1.5">
                      <Cpu className="h-3 w-3" /> Model
                    </Label>
                    <Input
                      id="model"
                      value={config.model ?? ''}
                      onChange={(e) => setConfig({ ...config, model: e.target.value })}
                      placeholder={selectedMeta.defaultModel}
                      className="font-mono text-sm"
                    />
                    <p className="text-[10px] text-muted-foreground font-mono">e.g. {selectedMeta.modelHint}</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="base-url" className="text-xs flex items-center gap-1.5">
                      <Server className="h-3 w-3" /> Base URL
                    </Label>
                    <Input
                      id="base-url"
                      value={config.baseUrl ?? ''}
                      onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                      placeholder={selectedMeta.defaultBaseUrl}
                      className="font-mono text-sm"
                    />
                    {selectedMeta.id === 'local' && (
                      <p className="text-[10px] text-muted-foreground font-mono">
                        Ollama: 11434 · LM Studio: 1234
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedMeta.id === 'zai' && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30 p-3 text-xs">
                <p className="flex items-center gap-1.5 font-medium text-emerald-800 dark:text-emerald-300">
                  <Check className="h-3.5 w-3.5" /> Ready to go
                </p>
                <p className="text-muted-foreground mt-1">
                  The built-in Z.ai model is configured and needs no API key. You can switch providers anytime.
                </p>
              </div>
            )}

            {/* Privacy note */}
            <div className="rounded-lg bg-muted/50 p-3 text-[11px] text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Your key stays in your browser.</strong> API keys are stored
              only in this browser's localStorage and sent directly to your chosen provider with each request -
              never to HubForge OS servers.
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
            <Check className="h-4 w-4" /> Save settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
