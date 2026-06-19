'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, FileText, Download, Settings, Terminal, Wand2, ArrowRight,
  Clock, Mic, Key, Cpu, Server, ExternalLink, Check, Eye, EyeOff, Database,
  Zap, ChevronDown, ChevronRight, Building2, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  PROVIDERS, getStoredProviderConfig, storeProviderConfig,
  type ProviderConfig, type ProviderMeta,
} from '@/lib/providers'
import { hasOrgSupabase } from '@/lib/org-supabase'

// ───────────────────────────────────────────────────────────────────────────
// Command Center - a unified panel that merges the command palette and the
// settings dialog into one Claude-style surface.
//
// Opens via Cmd+K OR the Settings button (both trigger the same panel).
// Layout:
//   1. Search bar at top (filters commands)
//   2. Actions section (filtered by search)
//   3. AI Provider section (always visible - form, not a command)
//   4. Navigation section (filtered by search)
//   5. Save button (persists provider config)
// ───────────────────────────────────────────────────────────────────────────

interface CommandItem {
  id: string
  label: string
  hint?: string
  icon: any
  action: () => void
  category: 'actions' | 'navigation'
  keywords?: string[]
}

interface CommandCenterProps {
  open: boolean
  onClose: () => void
  onNewProgram?: () => void
  onSwitchMode?: (mode: 'general' | 'geek') => void
  onOpenDataStorage?: () => void
  onOpenUsage?: () => void
  onProviderSaved?: (config: ProviderConfig) => void
  onOpenLanding?: () => void
  currentMode?: 'general' | 'geek'
  recentPrograms?: { id: string; title: string; score: number }[]
}

const BADGE_STYLES: Record<string, string> = {
  emerald: 'bg-emerald-600 text-white',
  amber: 'bg-amber-600 text-white',
}

export function CommandCenter({
  open, onClose, onNewProgram, onSwitchMode, onOpenDataStorage, onOpenUsage,
  onProviderSaved, onOpenLanding, currentMode, recentPrograms = [],
}: CommandCenterProps) {
  const [query, setQuery] = useState('')
  const [config, setConfig] = useState<ProviderConfig>(() => getStoredProviderConfig())
  const [showKey, setShowKey] = useState(false)
  const [providerSectionOpen, setProviderSectionOpen] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const selectedMeta = PROVIDERS.find((p) => p.id === config.provider)!

  const handleSelectProvider = (meta: ProviderMeta) => {
    setConfig({
      provider: meta.id,
      apiKey: meta.needsKey ? config.apiKey : '',
      baseUrl: meta.defaultBaseUrl,
      model: meta.defaultModel,
    })
  }

  const handleSaveProvider = () => {
    storeProviderConfig(config)
    onProviderSaved?.(config)
  }

  // Build the command list (excludes provider settings - those are a form).
  const commands: CommandItem[] = [
    ...(onNewProgram ? [{
      id: 'new-program', label: 'New Program', hint: 'Start a new strategy', icon: Plus,
      action: () => { onNewProgram(); onClose() }, category: 'actions' as const, keywords: ['new', 'create', 'start', 'program', 'strategy'],
    }] : []),
    ...(onSwitchMode && currentMode ? [{
      id: 'mode-toggle', label: currentMode === 'general' ? 'Switch to Geek Mode' : 'Switch to General Mode',
      hint: currentMode === 'general' ? 'Developer pipeline view' : 'NGO-friendly wizard',
      icon: currentMode === 'general' ? Terminal : Wand2,
      action: () => { onSwitchMode(currentMode === 'general' ? 'geek' : 'general'); onClose() },
      category: 'actions' as const,
      keywords: ['mode', 'switch', 'general', 'geek', 'developer', 'wizard', 'pipeline'],
    }] : []),
    ...(onOpenUsage ? [{
      id: 'usage', label: 'AI Consumption', hint: 'See your usage & rate limit', icon: Zap,
      action: () => { onOpenUsage(); onClose() }, category: 'actions' as const, keywords: ['usage', 'consumption', 'rate', 'limit', 'tokens', 'cost'],
    }] : []),
    ...(onOpenDataStorage ? [{
      id: 'data-storage', label: 'Connect Database', hint: hasOrgSupabase() ? 'Your Supabase is connected' : 'Connect your own Supabase',
      icon: Database,
      action: () => { onOpenDataStorage(); onClose() }, category: 'actions' as const,
      keywords: ['data', 'database', 'supabase', 'storage', 'connect', 'sync'],
    }] : []),
    {
      id: 'org', label: 'Organization Profile', hint: 'Edit your org context', icon: Building2,
      action: () => { window.location.href = '/organization'; onClose() }, category: 'navigation' as const,
      keywords: ['organization', 'org', 'profile', 'ngo', 'mission', 'sectors'],
    },
    ...(onOpenLanding ? [{
      id: 'landing', label: 'View Landing Page', hint: 'Show the marketing page', icon: Sparkles,
      action: () => { onOpenLanding(); onClose() }, category: 'navigation' as const,
      keywords: ['landing', 'home', 'marketing', 'about', 'overview'],
    }] : []),
    {
      id: 'help', label: 'Help & Documentation', hint: 'Guides, FAQ, tutorials', icon: FileText,
      action: () => { window.location.href = '/help'; onClose() }, category: 'navigation' as const,
      keywords: ['help', 'docs', 'guide', 'faq', 'tutorial', 'how'],
    },
    {
      id: 'admin', label: 'Admin Dashboard', hint: 'Analytics & user management', icon: FileText,
      action: () => { window.location.href = '/admin'; onClose() }, category: 'navigation' as const,
      keywords: ['admin', 'dashboard', 'analytics', 'users'],
    },
    {
      id: 'privacy', label: 'Privacy Policy', hint: 'How we handle your data', icon: FileText,
      action: () => { window.location.href = '/privacy'; onClose() }, category: 'navigation' as const,
      keywords: ['privacy', 'data', 'gdpr', 'policy'],
    },
  ]

  const filtered = query
    ? commands.filter((c) => {
        const q = query.toLowerCase()
        return c.label.toLowerCase().includes(q) ||
          c.hint?.toLowerCase().includes(q) ||
          c.keywords?.some((k) => k.includes(q))
      })
    : commands

  // Reset selection when query changes
  useEffect(() => { setSelectedIndex(0) }, [query])

  // Focus input + reset state when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setConfig(getStoredProviderConfig()) // reload latest from localStorage
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault()
      filtered[selectedIndex].action()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      // Cmd+S / Ctrl+S saves the provider config
      e.preventDefault()
      handleSaveProvider()
      onClose()
    }
  }, [filtered, selectedIndex, onClose, config])

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  // Group commands by category
  const grouped = filtered.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, CommandItem[]>)

  const categoryLabels: Record<string, string> = {
    actions: 'Actions',
    navigation: 'Navigation',
  }

  // Check if the query matches any provider (for highlighting)
  const queryMatchesProvider = query
    ? PROVIDERS.some((p) => {
        const q = query.toLowerCase()
        return p.label.toLowerCase().includes(q) || p.id.includes(q) ||
          p.description.toLowerCase().includes(q)
      })
    : false

  let flatIndex = 0
  const hasResults = filtered.length > 0

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[8vh] px-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-lg bg-background rounded-xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            {/* Search input */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search commands, providers, settings..."
                className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground"
              />
              <kbd className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">ESC</kbd>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1">
              {/* Commands (filtered) */}
              {hasResults && (
                <div ref={listRef} className="py-2">
                  {Object.entries(grouped).map(([category, items]) => (
                    <div key={category}>
                      <div className="px-4 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                        {categoryLabels[category] || category}
                      </div>
                      {items.map((item) => {
                        const idx = flatIndex++
                        return (
                          <button
                            key={item.id}
                            onClick={item.action}
                            className={cn(
                              'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors',
                              idx === selectedIndex ? 'bg-amber-50 dark:bg-amber-950/30' : 'hover:bg-muted/50'
                            )}
                          >
                            <item.icon className={cn(
                              'h-4 w-4 shrink-0',
                              idx === selectedIndex ? 'text-amber-600' : 'text-muted-foreground'
                            )} />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{item.label}</div>
                              {item.hint && <div className="text-[11px] text-muted-foreground truncate">{item.hint}</div>}
                            </div>
                            {idx === selectedIndex && (
                              <ArrowRight className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </div>
              )}

              {!hasResults && query && !queryMatchesProvider && (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No commands for "{query}"
                </div>
              )}

              {/* AI Provider section - always visible (it's a form, not a command) */}
              <div className="border-t border-border">
                <button
                  type="button"
                  onClick={() => setProviderSectionOpen((s) => !s)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-muted/30 transition-colors"
                >
                  {providerSectionOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  <Settings className="h-3.5 w-3.5 text-amber-600" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">AI Provider</span>
                  <span className="ml-auto text-[11px] text-muted-foreground truncate">{selectedMeta.label}</span>
                </button>

                {providerSectionOpen && (
                  <div className="px-4 pb-4 space-y-2">
                    {/* Provider picker - compact list */}
                    <div className="space-y-1">
                      {PROVIDERS.map((meta) => {
                        const selected = config.provider === meta.id
                        const matchesQuery = query
                          ? meta.label.toLowerCase().includes(query.toLowerCase()) ||
                            meta.id.includes(query.toLowerCase())
                          : true
                        if (!matchesQuery && query) return null // hide non-matching providers when searching
                        return (
                          <button
                            key={meta.id}
                            type="button"
                            onClick={() => handleSelectProvider(meta)}
                            className={cn(
                              'w-full text-left rounded-md border px-2.5 py-1.5 transition-all flex items-center gap-2',
                              selected
                                ? 'border-amber-500 ring-1 ring-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20'
                                : 'border-border hover:border-amber-500/40 hover:bg-muted/30'
                            )}
                          >
                            <div className={cn(
                              'h-3.5 w-3.5 rounded-full border-2 shrink-0 flex items-center justify-center',
                              selected ? 'border-amber-500' : 'border-muted-foreground/30'
                            )}>
                              {selected && <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                            </div>
                            <span className="text-xs font-medium flex-1">{meta.label}</span>
                            {meta.badge && (
                              <Badge className={cn('text-[8px] px-1 py-0 h-3.5', BADGE_STYLES[meta.badgeColor || 'amber'])}>
                                {meta.badge}
                              </Badge>
                            )}
                          </button>
                        )
                      })}
                    </div>

                    {/* Key + model + URL - only for non-shared providers */}
                    {selectedMeta.id !== 'zai' && (
                      <div className="space-y-2 rounded-md border border-border p-2.5 bg-muted/20">
                        {selectedMeta.needsKey && (
                          <div className="space-y-1">
                            <Label className="text-[10px] flex items-center gap-1.5">
                              <Key className="h-2.5 w-2.5" /> API key
                              {selectedMeta.docsUrl && (
                                <a href={selectedMeta.docsUrl} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-0.5 text-[9px] text-amber-700 dark:text-amber-400 hover:underline">
                                  <ExternalLink className="h-2.5 w-2.5" /> get key
                                </a>
                              )}
                            </Label>
                            <div className="relative">
                              <Input
                                type={showKey ? 'text' : 'password'}
                                value={config.apiKey ?? ''}
                                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                                placeholder="paste your API key..."
                                className="font-mono text-xs h-8 pr-8"
                              />
                              <button
                                type="button"
                                onClick={() => setShowKey(s => !s)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              </button>
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[10px] flex items-center gap-1"><Cpu className="h-2.5 w-2.5" /> Model</Label>
                            <Input
                              value={config.model ?? ''}
                              onChange={(e) => setConfig({ ...config, model: e.target.value })}
                              placeholder={selectedMeta.defaultModel}
                              className="font-mono text-xs h-8"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] flex items-center gap-1"><Server className="h-2.5 w-2.5" /> Base URL</Label>
                            <Input
                              value={config.baseUrl ?? ''}
                              onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                              placeholder={selectedMeta.defaultBaseUrl}
                              className="font-mono text-xs h-8"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedMeta.id === 'zai' && (
                      <div className="rounded-md border border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 p-2 text-[11px] flex items-start gap-1.5">
                        <Check className="h-3 w-3 text-amber-600 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">
                          Free shared AI. For unlimited use, switch to <strong>Z.ai (own key)</strong> or another provider.
                        </span>
                      </div>
                    )}

                    <p className="text-[9px] text-muted-foreground leading-relaxed">
                      Your key stays in this browser. Sent directly to your provider - never to HubForge servers.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/30 shrink-0">
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
                <span className="flex items-center gap-1"><kbd className="bg-background px-1 rounded">↑↓</kbd> navigate</span>
                <span className="flex items-center gap-1"><kbd className="bg-background px-1 rounded">↵</kbd> select</span>
                <span className="hidden sm:flex items-center gap-1"><kbd className="bg-background px-1 rounded">⌘S</kbd> save provider</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onClose}>Close</Button>
                <Button
                  size="sm"
                  className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
                  onClick={() => { handleSaveProvider(); onClose() }}
                >
                  <Check className="h-3 w-3" /> Save
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Hook to register Cmd+K / Ctrl+K
export function useCommandPalette(onOpen: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onOpen()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onOpen])
}
