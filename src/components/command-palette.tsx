'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, FileText, Download, Settings, Terminal, Wand2, ArrowRight, Clock, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommandItem {
  id: string
  label: string
  hint?: string
  icon: any
  action: () => void
  category: 'actions' | 'navigation' | 'recent'
  keywords?: string[]
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  onNewProgram?: () => void
  onSwitchMode?: (mode: 'general' | 'geek') => void
  onOpenSettings?: () => void
  onExport?: () => void
  onVoiceInput?: () => void
  recentPrograms?: { id: string; title: string; score: number }[]
}

export function CommandPalette({
  open, onClose, onNewProgram, onSwitchMode, onOpenSettings, onExport, onVoiceInput, recentPrograms = [],
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const commands: CommandItem[] = [
    // Actions
    ...(onNewProgram ? [{
      id: 'new-program', label: 'New Program', hint: 'Start a new strategy', icon: Plus,
      action: () => { onNewProgram(); onClose() }, category: 'actions' as const, keywords: ['new', 'create', 'start', 'program', 'strategy'],
    }] : []),
    ...(onVoiceInput ? [{
      id: 'voice-input', label: 'Voice Input', hint: 'Dictate your problem', icon: Mic,
      action: () => { onVoiceInput(); onClose() }, category: 'actions' as const, keywords: ['voice', 'dictate', 'speak', 'microphone', 'mic'],
    }] : []),
    ...(onExport ? [{
      id: 'export', label: 'Export Current Strategy', hint: 'Download as Word/PDF/Excel', icon: Download,
      action: () => { onExport(); onClose() }, category: 'actions' as const, keywords: ['export', 'download', 'word', 'pdf', 'excel', 'save'],
    }] : []),
    ...(onOpenSettings ? [{
      id: 'settings', label: 'AI Settings', hint: 'Change AI provider, API key', icon: Settings,
      action: () => { onOpenSettings(); onClose() }, category: 'actions' as const, keywords: ['settings', 'ai', 'provider', 'api', 'key', 'openai', 'zai'],
    }] : []),
    // Navigation
    ...(onSwitchMode ? [{
      id: 'mode-general', label: 'Switch to General Mode', hint: 'NGO-friendly wizard', icon: Wand2,
      action: () => { onSwitchMode('general'); onClose() }, category: 'navigation' as const, keywords: ['general', 'mode', 'switch', 'simple', 'wizard'],
    }] : []),
    ...(onSwitchMode ? [{
      id: 'mode-geek', label: 'Switch to Geek Mode', hint: 'Developer pipeline view', icon: Terminal,
      action: () => { onSwitchMode('geek'); onClose() }, category: 'navigation' as const, keywords: ['geek', 'mode', 'switch', 'developer', 'pipeline', 'technical'],
    }] : []),
    {
      id: 'help', label: 'Help & Documentation', hint: 'Guides, FAQ, tutorials', icon: FileText,
      action: () => { window.location.href = '/help'; onClose() }, category: 'navigation' as const, keywords: ['help', 'docs', 'guide', 'faq', 'tutorial', 'how'],
    },
    {
      id: 'privacy', label: 'Privacy Policy', hint: 'How we handle your data', icon: FileText,
      action: () => { window.location.href = '/privacy'; onClose() }, category: 'navigation' as const, keywords: ['privacy', 'data', 'gdpr', 'policy'],
    },
    {
      id: 'terms', label: 'Terms of Service', hint: 'Usage terms', icon: FileText,
      action: () => { window.location.href = '/terms'; onClose() }, category: 'navigation' as const, keywords: ['terms', 'service', 'legal', 'agreement'],
    },
    {
      id: 'admin', label: 'Admin Dashboard', hint: 'Analytics & user management', icon: FileText,
      action: () => { window.location.href = '/admin'; onClose() }, category: 'navigation' as const, keywords: ['admin', 'dashboard', 'analytics', 'users'],
    },
    // Recent programs
    ...recentPrograms.map((p, i) => ({
      id: `recent-${i}`, label: p.title, hint: `Score: ${p.score}/100`, icon: Clock,
      action: () => { onClose() }, category: 'recent' as const, keywords: [p.title.toLowerCase()],
    })),
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

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('')
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
    } else if (e.key === 'Enter') {
      e.preventDefault()
      filtered[selectedIndex]?.action()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }, [filtered, selectedIndex, onClose])

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  // Group by category
  const grouped = filtered.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, CommandItem[]>)

  const categoryLabels: Record<string, string> = {
    actions: 'Actions',
    navigation: 'Navigation',
    recent: 'Recent Programs',
  }

  let flatIndex = 0

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-lg bg-background rounded-xl border border-border shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            {/* Search input */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search..."
                className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground"
              />
              <kbd className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">ESC</kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[400px] overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No results for "{query}"
                </div>
              ) : (
                Object.entries(grouped).map(([category, items]) => (
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
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30">
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
                <span className="flex items-center gap-1"><kbd className="bg-background px-1 rounded">↑↓</kbd> navigate</span>
                <span className="flex items-center gap-1"><kbd className="bg-background px-1 rounded">↵</kbd> select</span>
              </div>
              <div className="text-[10px] text-muted-foreground font-mono">
                HubForge OS
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
