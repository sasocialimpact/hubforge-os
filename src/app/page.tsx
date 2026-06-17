'use client'

import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { BrainCircuit, Sparkles, Layers, Settings, Terminal, Wand2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { socialImpactPackMeta } from '@/lib/social-impact-pack'
import { GeneralMode } from '@/components/general-mode'
import { GeekMode } from '@/components/geek-mode'
import { SettingsDialog } from '@/components/settings-dialog'
import { getStoredProviderConfig, type ProviderConfig } from '@/lib/providers'

type Mode = 'general' | 'geek'

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [mode, setMode] = useState<Mode>('general')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [providerConfig, setProviderConfig] = useState<ProviderConfig>(() => getStoredProviderConfig())

  useEffect(() => {
    const s = io('/?XTransformPort=3003', {
      path: '/',
      transports: ['polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 30000,
    })
    const handleConnect = () => { setSocket(s); setConnected(true); s.emit('memory:list', {}) }
    s.on('connect', handleConnect)
    s.on('disconnect', () => setConnected(false))
    s.on('connect_error', () => setConnected(false))
    return () => { s.off('connect', handleConnect); s.disconnect() }
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative h-9 w-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
              <BrainCircuit className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-base leading-tight tracking-tight">HubForge OS</div>
              <div className="text-[10px] font-mono text-muted-foreground leading-tight">social impact pack</div>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="ml-4 hidden sm:flex items-center rounded-lg border border-border bg-muted/50 p-0.5">
            <button
              type="button"
              onClick={() => setMode('general')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                mode === 'general' ? 'bg-background shadow-sm text-amber-700 dark:text-amber-400' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Wand2 className="h-3.5 w-3.5" /> General
            </button>
            <button
              type="button"
              onClick={() => setMode('geek')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                mode === 'geek' ? 'bg-background shadow-sm text-amber-700 dark:text-amber-400' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Terminal className="h-3.5 w-3.5" /> Geek
            </button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline" className="hidden md:inline-flex gap-1 font-mono text-[10px]">
              <Layers className="h-3 w-3" /> v0.1 · Apache-2.0
            </Badge>
            <Badge className="gap-1 bg-amber-600 hover:bg-amber-600 text-white">
              <Sparkles className="h-3 w-3" /> {socialImpactPackMeta.name}
            </Badge>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs px-2" onClick={() => setSettingsOpen(true)}>
              <Settings className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
            <ConnectionPill connected={connected} />
          </div>
        </div>

        {/* Mobile mode toggle */}
        <div className="sm:hidden border-t border-border px-4 py-2 flex items-center gap-1">
          <button type="button" onClick={() => setMode('general')} className={cn('flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium', mode === 'general' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'text-muted-foreground')}>
            <Wand2 className="h-3.5 w-3.5" /> General
          </button>
          <button type="button" onClick={() => setMode('geek')} className={cn('flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium', mode === 'geek' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'text-muted-foreground')}>
            <Terminal className="h-3.5 w-3.5" /> Geek
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">
        {mode === 'general' ? (
          <GeneralMode socket={socket} connected={connected} />
        ) : (
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
            <GeekMode socket={socket} connected={connected} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] font-mono text-muted-foreground">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-3.5 w-3.5 text-amber-600" />
            <span>HubForge OS · open-source decision intelligence infrastructure</span>
          </div>
          <div className="flex items-center gap-3">
            <span>build systems that think better.</span>
            <Badge variant="outline" className="font-mono text-[10px]">Apache-2.0</Badge>
          </div>
        </div>
      </footer>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} onSaved={setProviderConfig} />
    </div>
  )
}

function ConnectionPill({ connected }: { connected: boolean }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono',
      connected
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
        : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full', connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500')} />
      {connected ? 'online' : 'offline'}
    </span>
  )
}
