'use client'

import { useState, useEffect, useCallback } from 'react'
import { Settings, LayoutGrid, Zap, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { GeneralMode } from '@/components/general-mode'
import { GeekMode } from '@/components/geek-mode'
import { LandingPage } from '@/components/landing-page'
import { DataStorageDialog } from '@/components/data-storage-dialog'
import { ProgramDashboard } from '@/components/program-dashboard'
import { UsagePanel } from '@/components/usage-panel'
import { InstallPrompt } from '@/components/install-prompt'
import { FirstRunOnboarding, useShouldOnboard } from '@/components/onboarding'
import { CommandCenter, useCommandPalette } from '@/components/command-palette'
import { AuthDialog } from '@/components/auth-dialog'
import { isLoggedIn, getDisplayEmail, getInitials } from '@/lib/auth'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getStoredProviderConfig, type ProviderConfig } from '@/lib/providers'
import { hasOrgSupabase, type OrgSupabaseConfig } from '@/lib/org-supabase'
import { resetOrgSupabaseBrowser } from '@/lib/org-supabase-sync'
import { analytics, track } from '@/lib/analytics'

type Mode = 'general' | 'geek'

export default function Home() {
  const [mode, setMode] = useState<Mode>('general')
  // 'landing' = marketing landing page (default for first visit)
  // 'dashboard' = saved programs grid
  // 'workspace' = general/geek mode builder
  const [view, setView] = useState<'landing' | 'dashboard' | 'workspace'>(() => {
    if (typeof window === 'undefined') return 'landing'
    // Returning users skip the landing page. First-time visitors see it.
    return localStorage.getItem('hubforge.landingSeen') ? 'dashboard' : 'landing'
  })
  // CommandCenter replaces both SettingsDialog and CommandPalette.
  // Opens via Cmd+K OR the Settings button.
  const [commandCenterOpen, setCommandCenterOpen] = useState(false)
  const [dataStorageOpen, setDataStorageOpen] = useState(false)
  const [usageOpen, setUsageOpen] = useState(false)
  const [providerConfig, setProviderConfig] = useState<ProviderConfig>(() => getStoredProviderConfig())
  // Bump this counter to force the header to re-check hasOrgSupabase() after
  // the user saves/disconnects in the DataStorageDialog.
  const [orgSupabaseRev, setOrgSupabaseRev] = useState(0)
  // Auth: bump this counter to force re-render after login/logout.
  // The auth state itself lives in localStorage (src/lib/auth.ts); this
  // counter just tells React "something changed, re-read isLoggedIn()."
  const [authRev, setAuthRev] = useState(0)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signup' | 'login' | 'account'>('signup')
  const shouldOnboard = useShouldOnboard()
  const [onboardingDone, setOnboardingDone] = useState(false)

  const connected = true

  useEffect(() => { analytics.appOpen() }, [])

  // Register Cmd+K / Ctrl+K → opens the unified CommandCenter
  useCommandPalette(useCallback(() => setCommandCenterOpen(true), []))

  const handleDataStorageSaved = (config: OrgSupabaseConfig | null) => {
    // Force header re-render so the green dot appears/disappears immediately.
    setOrgSupabaseRev((n) => n + 1)
    if (!config) {
      resetOrgSupabaseBrowser()
      track('data_storage_disconnected', { category: 'engagement' })
    } else {
      track('data_storage_connected', { category: 'engagement' })
    }
  }

  const handleModeSwitch = (newMode: Mode) => {
    setMode(newMode)
    analytics.modeSwitch(newMode)
  }

  const openCommandCenter = () => {
    setCommandCenterOpen(true)
    analytics.settingsOpened()
  }

  // Launch from the landing page → mark as seen, go to dashboard.
  const handleLaunch = () => {
    try { localStorage.setItem('hubforge.landingSeen', '1') } catch {}
    setView('dashboard')
  }

  const handleProviderSaved = (newConfig: ProviderConfig) => {
    setProviderConfig(newConfig)
    analytics.providerChanged({ from: providerConfig.provider, to: newConfig.provider })
  }

  const handleOnboardingComplete = () => {
    setOnboardingDone(true)
    analytics.onboardingComplete({
      provider: providerConfig.provider,
      hasKey: providerConfig.provider === 'zai-key' || !!providerConfig.apiKey,
      sharedProfile: true,
    })
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
      {/* ── Landing page (full-screen, no app header) ── */}
      {view === 'landing' ? (
        <LandingPage
          onLaunch={handleLaunch}
          onSignIn={() => { setAuthMode('login'); setAuthOpen(true) }}
        />
      ) : (
        <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          {/* Logo + name — clickable to return to dashboard */}
          <button onClick={() => setView('dashboard')} className="flex items-center gap-2.5">
            <img src="/hubforge-os-icon.png" alt="HubForge OS" className="h-8 w-8 rounded-lg" />
            <div className="text-left">
              <div className="font-bold text-base leading-tight tracking-tight">HubForge OS</div>
              <div className="text-[10px] font-mono text-muted-foreground leading-tight">M&amp;E operating system</div>
            </div>
          </button>

          {/* Jobs discipline: 3 buttons + identity. Everything else lives in Cmd+K. */}
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs px-2" onClick={() => setView(view === 'dashboard' ? 'workspace' : 'dashboard')}>
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{view === 'dashboard' ? 'Workspace' : 'Programs'}</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs px-2" onClick={openCommandCenter}>
              <Settings className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
            <button
              onClick={() => setCommandCenterOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-[10px] font-mono text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
              title="Command center (Cmd+K) — Org, Data, Usage, Mode, Help, Admin"
            >
              <kbd>⌘</kbd><kbd>K</kbd>
              {orgSupabaseRev >= 0 && hasOrgSupabase() && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ml-0.5" />}
            </button>
            {/* Identity: Sign in (logged out) or Account avatar (logged in) */}
            {authRev >= 0 && isLoggedIn() ? (
              <button
                onClick={() => { setAuthMode('account'); setAuthOpen(true) }}
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border border-border hover:border-amber-500/40 hover:bg-muted/50 transition-colors"
                title={getDisplayEmail() || 'Account'}
              >
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-[10px] font-bold">
                  {getInitials()}
                </div>
                <span className="hidden sm:inline text-xs font-medium max-w-[120px] truncate">{getDisplayEmail()}</span>
              </button>
            ) : (
              <Button
                size="sm"
                className="gap-1.5 text-xs px-3 bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => { setAuthMode('signup'); setAuthOpen(true) }}
              >
                <User className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign in</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {view === 'dashboard' ? (
          <ProgramDashboard
            onNewProgram={() => { setView('workspace'); setMode('general') }}
            onOpenProgram={() => { setView('workspace') }}
            onOpenSettings={openCommandCenter}
            onOpenDataStorage={() => setDataStorageOpen(true)}
          />
        ) : (
          <>
            <div className={cn(mode === 'general' ? 'block' : 'hidden')}>
              <GeneralMode connected={connected} providerConfig={providerConfig} />
            </div>
            <div className={cn(mode === 'geek' ? 'block' : 'hidden')}>
              <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
                <GeekMode connected={connected} providerConfig={providerConfig} />
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-border bg-background mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] font-mono text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src="/hubforge-os-icon.png" alt="HubForge OS" className="h-4 w-4 rounded" />
            <span>HubForge OS - open-source M&amp;E operating system</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/organization" className="hover:text-amber-700 dark:hover:text-amber-400">Organization</a>
            <a href="/help" className="hover:text-amber-700 dark:hover:text-amber-400">Help</a>
            <a href="/privacy" className="hover:text-amber-700 dark:hover:text-amber-400">Privacy</a>
            <a href="/terms" className="hover:text-amber-700 dark:hover:text-amber-400">Terms</a>
            <a href="/admin" className="hover:text-amber-700 dark:hover:text-amber-400">Admin</a>
            <Badge variant="outline" className="font-mono text-[10px]">Apache-2.0</Badge>
          </div>
        </div>
      </footer>

      {/* Unified Command Center — replaces SettingsDialog + CommandPalette */}
      <CommandCenter
        open={commandCenterOpen}
        onClose={() => setCommandCenterOpen(false)}
        onSwitchMode={handleModeSwitch}
        onProviderSaved={handleProviderSaved}
        onNewProgram={() => { setView('workspace'); setMode('general') }}
        onOpenDataStorage={() => setDataStorageOpen(true)}
        onOpenUsage={() => setUsageOpen(true)}
        currentMode={view === 'workspace' ? mode : undefined}
      />
      <DataStorageDialog open={dataStorageOpen} onOpenChange={setDataStorageOpen} onSaved={handleDataStorageSaved} />
      <Dialog open={usageOpen} onOpenChange={setUsageOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4 text-amber-600" /> AI Consumption
            </DialogTitle>
          </DialogHeader>
          <UsagePanel onOpenSettings={openCommandCenter} />
        </DialogContent>
      </Dialog>
      <InstallPrompt />
      {shouldOnboard && !onboardingDone && (
        <FirstRunOnboarding onComplete={handleOnboardingComplete} />
      )}
      {/* Auth dialog — signup/login/account. onAuthChange bumps authRev to force header re-render. */}
      <AuthDialog
        key={`${authMode}-${authOpen}`}
        open={authOpen}
        onOpenChange={setAuthOpen}
        initialMode={authMode}
        onAuthChange={() => setAuthRev((n) => n + 1)}
      />
        </>
      )}
    </div>
  )
}
