'use client'
import { useState, useEffect } from 'react'
import { Download, X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { track } from '@/lib/analytics'

interface BeforeInstallPromptEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
const DISMISS_KEY = 'hubforge.installDismissed'
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if ((window as any).navigator.standalone === true) return
    try { const dismissed = localStorage.getItem(DISMISS_KEY); if (dismissed) { if (Date.now() - parseInt(dismissed, 10) < DISMISS_DURATION) return } } catch {}
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e as BeforeInstallPromptEvent); track('install_prompt_shown', { category: 'engagement' }); setTimeout(() => setShow(true), 3000) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => { if (!deferredPrompt) return; await deferredPrompt.prompt(); const choice = await deferredPrompt.userChoice; if (choice.outcome === 'accepted') { track('install_accepted', { category: 'engagement' }); setShow(false); setDeferredPrompt(null) } else { track('install_dismissed', { category: 'engagement' }); handleDismiss() } }
  const handleDismiss = () => { track('install_dismissed', { category: 'engagement' }); setShow(false); try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch {} }
  if (!show || !deferredPrompt) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-background/95 backdrop-blur shadow-lg px-4 py-3 max-w-md">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0"><Sparkles className="h-4 w-4 text-white" /></div>
        <div className="flex-1 min-w-0"><p className="text-sm font-medium">Install HubForge OS</p><p className="text-[11px] text-muted-foreground leading-snug">Add to your desktop for quick access. Works offline.</p></div>
        <Button size="sm" className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white shrink-0" onClick={handleInstall}><Download className="h-3.5 w-3.5" /> Install</Button>
        <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground shrink-0 p-1"><X className="h-4 w-4" /></button>
      </div>
    </div>
  )
}
