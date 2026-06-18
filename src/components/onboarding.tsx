'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Check, ArrowRight, BrainCircuit, Key, ExternalLink, User, Mail, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getStoredProviderConfig, storeProviderConfig, type ProviderConfig } from '@/lib/providers'
import { getProfileId, storeProfile, syncProfile, COUNTRIES, ROLES, type UserProfile } from '@/lib/user-profile'
import { analytics } from '@/lib/analytics'
import { cn } from '@/lib/utils'

const ONBOARDING_KEY = 'hubforge.onboarded'

export function FirstRunOnboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const [config, setConfig] = useState<ProviderConfig>(() => getStoredProviderConfig())
  const [zaiKey, setZaiKey] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [organization, setOrganization] = useState('')
  const [country, setCountry] = useState('')
  const [role, setRole] = useState('')

  const handleFinish = () => {
    storeProviderConfig(config)
    const profile: UserProfile = { profileId: getProfileId(), name: name.trim(), email: email.trim(), organization: organization.trim(), country, role }
    storeProfile(profile); syncProfile(profile).catch(() => {})
    analytics.onboardingComplete({ provider: config.provider, hasKey: config.provider === 'zai-key' || !!config.apiKey, sharedProfile: !!name.trim() })
    try { localStorage.setItem(ONBOARDING_KEY, String(Date.now())) } catch {}
    onComplete()
  }
  const handleUseShared = () => { setConfig({ provider: 'zai' }); setStep(4) }
  const handleUseOwnKey = () => { setStep(2) }
  const handleSaveZaiKey = () => { setConfig({ provider: 'zai-key', apiKey: zaiKey.trim(), baseUrl: 'https://api.z.ai/api/paas/v4', model: 'glm-4.6' }); setStep(4) }
  const canContinueProfile = name.trim() && email.trim().includes('@')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md my-8">
        <Card className="p-0 overflow-hidden shadow-xl">
          <AnimatePresence mode="wait">
            {step === 0 && (<motion.div key="welcome" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 text-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4 shadow-lg"><BrainCircuit className="h-8 w-8 text-white" /></div>
              <h1 className="text-xl font-bold mb-2">Welcome to HubForge OS</h1>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">Build expert-grade program strategies, theories of change, and logframes in minutes. No M&E expertise needed.</p>
              <div className="space-y-2 text-left mb-6">{['Describe your project in plain language','Get a strategy, theory of change, and logframe','Give feedback to refine the output','Works offline after first visit'].map((f, i) => (<div key={i} className="flex items-center gap-2 text-sm"><div className="h-5 w-5 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center shrink-0"><Check className="h-3 w-3 text-amber-600" /></div><span>{f}</span></div>))}</div>
              <Button onClick={() => { analytics.onboardingStart(); setStep(1) }} className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white">Get started <ArrowRight className="h-4 w-4" /></Button>
            </motion.div>)}
            {step === 1 && (<motion.div key="choose" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6">
              <h2 className="text-lg font-bold mb-1">Choose your AI</h2>
              <p className="text-xs text-muted-foreground mb-4">HubForge needs an AI to generate your strategies.</p>
              <div className="space-y-2">
                <button onClick={handleUseOwnKey} className="w-full text-left rounded-lg border border-amber-500 ring-1 ring-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 p-4 transition-all flex gap-3"><div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0"><Key className="h-5 w-5 text-white" /></div><div className="flex-1"><div className="flex items-center gap-2"><span className="font-medium text-sm">Use your own Z.ai key</span><Badge className="bg-amber-600 text-white text-[9px]">RECOMMENDED</Badge></div><p className="text-[11px] text-muted-foreground mt-0.5">Free forever. Takes 30 seconds.</p></div></button>
                <button onClick={handleUseShared} className="w-full text-left rounded-lg border border-border hover:border-amber-500/50 p-4 transition-all flex gap-3"><div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0"><Sparkles className="h-5 w-5 text-muted-foreground" /></div><div className="flex-1"><div className="flex items-center gap-2"><span className="font-medium text-sm">Use shared AI</span><Badge variant="outline" className="text-[9px]">QUICK START</Badge></div><p className="text-[11px] text-muted-foreground mt-0.5">No setup needed. May have limits.</p></div></button>
              </div>
            </motion.div>)}
            {step === 2 && (<motion.div key="zaikey" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6">
              <h2 className="text-lg font-bold mb-1">Get your free Z.ai API key</h2>
              <p className="text-xs text-muted-foreground mb-4">This takes 30 seconds. Your key stays in your browser.</p>
              <div className="rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 p-3 mb-4"><ol className="text-[11px] text-muted-foreground space-y-1 list-decimal list-inside"><li>Go to <strong>z.ai/manage/apikey</strong></li><li>Sign up (free)</li><li>Click "Create API Key"</li><li>Copy and paste below</li></ol><a href="https://z.ai/manage/apikey" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 hover:underline font-medium"><ExternalLink className="h-3 w-3" /> Open z.ai/manage/apikey</a></div>
              <div className="space-y-2 mb-4"><Label htmlFor="zk" className="text-xs">Paste your Z.ai API key</Label><Input id="zk" type="password" value={zaiKey} onChange={(e) => setZaiKey(e.target.value)} placeholder="your-api-key-here…" className="font-mono text-sm" /></div>
              <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setStep(1)} className="shrink-0">Back</Button><Button onClick={handleSaveZaiKey} disabled={!zaiKey.trim()} className="flex-1 gap-2 bg-amber-600 hover:bg-amber-700 text-white"><Check className="h-4 w-4" /> Save & continue</Button></div>
              <button onClick={handleUseShared} className="mt-3 text-[10px] text-muted-foreground hover:text-amber-700 w-full text-center">Skip — use shared AI</button>
            </motion.div>)}
            {step === 4 && (<motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6">
              <h2 className="text-lg font-bold mb-1">Tell us about yourself</h2>
              <p className="text-xs text-muted-foreground mb-4">We use this to improve HubForge OS. Your details stay private.</p>
              <div className="space-y-3">
                <div className="space-y-1"><Label htmlFor="n" className="text-xs flex items-center gap-1.5"><User className="h-3 w-3" /> Name <span className="text-red-500">*</span></Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="text-sm" /></div>
                <div className="space-y-1"><Label htmlFor="e" className="text-xs flex items-center gap-1.5"><Mail className="h-3 w-3" /> Email <span className="text-red-500">*</span></Label><Input id="e" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@organization.org" className="text-sm" /></div>
                <div className="space-y-1"><Label htmlFor="o" className="text-xs flex items-center gap-1.5"><Building2 className="h-3 w-3" /> Organization</Label><Input id="o" value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="Your NGO (optional)" className="text-sm" /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label className="text-xs">Country</Label><Select value={country} onValueChange={setCountry}><SelectTrigger className="text-sm h-9"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent className="max-h-60">{COUNTRIES.map((c) => <SelectItem key={c} value={c} className="text-sm">{c}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1"><Label className="text-xs">Role</Label><Select value={role} onValueChange={setRole}><SelectTrigger className="text-sm h-9"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r} className="text-sm">{r}</SelectItem>)}</SelectContent></Select></div>
                </div>
              </div>
              <Button onClick={handleFinish} disabled={!canContinueProfile} className="w-full mt-5 gap-2 bg-amber-600 hover:bg-amber-700 text-white"><Check className="h-4 w-4" /> Start building</Button>
              <button onClick={handleFinish} className="mt-2 text-[10px] text-muted-foreground hover:text-amber-700 w-full text-center">Skip — continue without sharing</button>
            </motion.div>)}
          </AnimatePresence>
          <div className="flex justify-center gap-1.5 pb-4">{[0, 1, 4].map((s, i) => (<div key={i} className={cn('h-1.5 rounded-full transition-all', step === s ? 'w-6 bg-amber-500' : step > s ? 'w-1.5 bg-amber-500/40' : 'w-1.5 bg-muted')} />))}</div>
        </Card>
      </motion.div>
    </div>
  )
}

export function useShouldOnboard() {
  const [shouldOnboard] = useState(() => { if (typeof window === 'undefined') return false; try { return !localStorage.getItem(ONBOARDING_KEY) } catch { return false } })
  return shouldOnboard
}
