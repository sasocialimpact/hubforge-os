'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BrainCircuit, ArrowRight, Check, Gift, KeyRound, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getProfileId, storeProfile, syncProfile, type UserProfile } from '@/lib/user-profile'
import { storeOrgProfile, type OrganizationProfile } from '@/lib/organization'
import { analytics } from '@/lib/analytics'

const ONBOARDING_KEY = 'hubforge.onboarded'

export function FirstRunOnboarding({ onComplete }: { onComplete: () => void }) {
  const [name, setName] = useState('')
  const [orgName, setOrgName] = useState('')

  const handleStart = () => {
    // Save profile
    const profile: UserProfile = {
      profileId: getProfileId(),
      name: name.trim(),
      email: '', // ask later, don't block onboarding
      organization: orgName.trim(),
      country: '',
      role: '',
    }
    storeProfile(profile)
    syncProfile(profile).catch(() => {})

    // Save minimal org profile
    if (orgName.trim()) {
      const orgProfile: OrganizationProfile = {
        id: `org-${Date.now()}`,
        name: orgName.trim(),
        type: 'NGO (National)',
        registrationCountry: '',
        operatingCountries: [],
        operatingGeographies: '',
        sectors: [],
        mission: '',
        teamSize: '1-10',
        meCapacity: 'None',
        budgetRange: 'Under $50K',
        keyDonors: '',
        reportingFrameworks: '',
        languages: '',
        pastResults: '',
        updatedAt: new Date().toISOString(),
      }
      storeOrgProfile(orgProfile)
    }

    analytics.onboardingStart()
    analytics.onboardingComplete({
      provider: 'zai',
      hasKey: false,
      sharedProfile: !!name.trim(),
    })

    try { localStorage.setItem(ONBOARDING_KEY, String(Date.now())) } catch {}
    onComplete()
  }

  const canStart = name.trim().length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 shadow-xl">
          {/* Logo */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-4 shadow-lg">
              <BrainCircuit className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-xl font-bold">Welcome to HubForge</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Build expert program strategies in minutes.
            </p>
          </div>

          {/* Single form - no steps, no wizard */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs">Your name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && canStart && handleStart()}
                placeholder="Priya"
                className="text-sm"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="org" className="text-xs">Organization (optional)</Label>
              <Input
                id="org"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && canStart && handleStart()}
                placeholder="Rural Education Action Program"
                className="text-sm"
              />
            </div>
          </div>

          {/* How HubForge stays free - compact 3-line explainer */}
          <div className="rounded-lg border border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20 p-3 space-y-1.5 mt-1">
            <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1">How HubForge stays free</div>
            <div className="flex items-center gap-2 text-[11px] leading-tight">
              <Gift className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Free forever - Z.ai's shared AI key works out of the box</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] leading-tight">
              <KeyRound className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>Add your own key (OpenAI, Groq, etc.) for unlimited strategies</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] leading-tight">
              <Database className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <span>Connect your own Supabase to own your data</span>
            </div>
          </div>

          {/* Start button - prominent */}
          <Button
            onClick={handleStart}
            disabled={!canStart}
            className="w-full mt-5 h-11 gap-2 bg-amber-600 hover:bg-amber-700 text-white text-base"
          >
            Start building <ArrowRight className="h-4 w-4" />
          </Button>

          {/* Minimal footer */}
          <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-muted-foreground">
            <span>Using built-in AI (free)</span>
            <span>-</span>
            <a href="/privacy" className="hover:text-amber-700">Privacy</a>
            <a href="/terms" className="hover:text-amber-700">Terms</a>
          </div>

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><Check className="h-3 w-3 text-emerald-500" /> No setup</span>
            <span className="flex items-center gap-1"><Check className="h-3 w-3 text-emerald-500" /> Works offline</span>
            <span className="flex items-center gap-1"><Check className="h-3 w-3 text-emerald-500" /> Open source</span>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

export function useShouldOnboard() {
  const [shouldOnboard] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      // Already onboarded - skip
      if (localStorage.getItem(ONBOARDING_KEY)) return false
      // Logged in users already provided their name/org during signup,
      // so don't show the onboarding modal (it would ask for the same info again).
      const session = localStorage.getItem('hubforge.session')
      if (session) return false
      // Not onboarded + not logged in = show onboarding
      return true
    } catch { return false }
  })
  return shouldOnboard
}
