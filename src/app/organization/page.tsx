'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2, Check, Globe2, Users, DollarSign, Target, FileText,
  ArrowLeft, Sparkles, CheckCircle2, ChevronDown, ChevronRight, Plus, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  getOrgProfile, storeOrgProfile,
  ORG_TYPES, SECTORS, BUDGET_RANGES, type OrganizationProfile,
} from '@/lib/organization'
import { cn } from '@/lib/utils'

// Collapsible section wrapper - keeps the single panel compact while still
// letting users jump to the section they want to edit.
function Section({
  icon: Icon, title, subtitle, open, onToggle, children,
}: {
  icon: any; title: string; subtitle: string; open: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
      >
        <Icon className="h-4 w-4 text-amber-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-[11px] text-muted-foreground truncate">{subtitle}</div>
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4 pt-1 space-y-4 border-t border-border">{children}</div>}
    </Card>
  )
}

export default function OrganizationPage() {
  const router = useRouter()
  // Lazy-init from localStorage so we don't trigger a cascading render in
  // useEffect. On the server (window undefined) we return a placeholder; the
  // `mounted` flag triggers a re-render on the client to show the real data.
  const [profile, setProfile] = useState<OrganizationProfile | null>(() => {
    if (typeof window === 'undefined') return null
    return getOrgProfile() || {
      id: `org-${Date.now()}`, name: '', type: 'NGO (National)', registrationCountry: '',
      operatingCountries: [], operatingGeographies: '', sectors: [], mission: '',
      teamSize: '1-10', meCapacity: 'None', budgetRange: 'Under $50K',
      keyDonors: '', reportingFrameworks: '', languages: '', pastResults: '', updatedAt: '',
    }
  })
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)
  const [operatingCountry, setOperatingCountry] = useState('')
  // Default: identity open (most important), others collapsed for first-time.
  // When editing, all start open so the user sees everything at once.
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return { identity: true, operations: false, donors: false }
    const existing = getOrgProfile()
    // Editing an existing profile → expand all sections so everything is visible.
    if (existing) return { identity: true, operations: true, donors: true }
    return { identity: true, operations: false, donors: false }
  })

  const update = <K extends keyof OrganizationProfile>(key: K, value: OrganizationProfile[K]) => {
    setProfile((p) => p ? { ...p, [key]: value } : p)
    setDirty(true)
    setSaved(false)
  }

  const toggleSector = (sector: string) => {
    if (!profile) return
    const has = profile.sectors.includes(sector)
    update('sectors', has ? profile.sectors.filter((s) => s !== sector) : [...profile.sectors, sector])
  }

  const addCountry = () => {
    if (!profile || !operatingCountry.trim()) return
    const c = operatingCountry.trim()
    if (!profile.operatingCountries.includes(c)) {
      update('operatingCountries', [...profile.operatingCountries, c])
    }
    setOperatingCountry('')
  }

  const removeCountry = (country: string) => {
    if (!profile) return
    update('operatingCountries', profile.operatingCountries.filter((c) => c !== country))
  }

  const handleSave = () => {
    if (!profile) return
    storeOrgProfile({ ...profile, updatedAt: new Date().toISOString() })
    setDirty(false)
    setSaved(true)
    // Auto-hide the "Saved" confirmation after 2.5s.
    setTimeout(() => setSaved(false), 2500)
  }

  const handleBack = () => {
    // If there are unsaved changes, confirm before leaving.
    if (dirty && !confirm('You have unsaved changes. Leave without saving?')) return
    router.push('/')
  }

  // On the server (window undefined) profile is null - render a loading
  // placeholder to avoid hydration mismatch. The client lazy-inits from
  // localStorage on first render, so this only flashes for SSR.
  if (!profile) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center">
        <div className="text-xs text-muted-foreground font-mono">Loading…</div>
      </div>
    )
  }

  const hasProfile = !!profile.updatedAt
  const canSave = profile.name.trim().length > 0

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <button onClick={handleBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground shrink-0">
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back to app</span>
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="text-sm font-semibold truncate">
              {hasProfile ? profile.name || 'Organization' : 'Set up organization'}
            </span>
            {hasProfile && !dirty && (
              <Badge variant="outline" className="gap-1 text-[9px] border-emerald-500/40 text-emerald-700 dark:text-emerald-300 shrink-0">
                <CheckCircle2 className="h-2.5 w-2.5" /> Saved
              </Badge>
            )}
            {dirty && (
              <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-700 dark:text-amber-300 shrink-0">
                Unsaved
              </Badge>
            )}
            {saved && (
              <Badge className="gap-1 text-[9px] bg-emerald-600 text-white shrink-0">
                <Check className="h-2.5 w-2.5" /> Saved!
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-4">
        {/* Intro */}
        <div className="space-y-1">
          <h1 className="text-xl font-bold">
            {hasProfile ? 'Organization profile' : 'Tell us about your organization'}
          </h1>
          <p className="text-sm text-muted-foreground">
            This context is automatically included in every strategy you build. Edit any field below and click Save.
          </p>
        </div>

        {/* Pre-filled banner (shown when org was seeded from signup) */}
        {hasProfile && profile.name && !profile.mission && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium text-emerald-800 dark:text-emerald-300">Pre-filled from your signup</p>
              <p className="text-muted-foreground mt-0.5">
                We've auto-filled your organization name and country from your account. Add more details below (mission, sectors, donors) to make your strategies even better.
              </p>
            </div>
          </div>
        )}

        {/* Section 1: Identity */}
        <Section
          icon={Building2}
          title="Identity"
          subtitle={`${profile.name || 'Not set'} • ${profile.type}${profile.registrationCountry ? ' • ' + profile.registrationCountry : ''}`}
          open={openSections.identity}
          onToggle={() => setOpenSections((s) => ({ ...s, identity: !s.identity }))}
        >
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1"><Building2 className="h-3 w-3" /> Organization name *</Label>
            <Input
              value={profile.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. Rural Education Action Program"
              className="text-sm h-10"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select value={profile.type} onValueChange={(v) => update('type', v)}>
                <SelectTrigger className="text-sm h-10"><SelectValue /></SelectTrigger>
                <SelectContent>{ORG_TYPES.map((t) => <SelectItem key={t} value={t} className="text-sm">{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1"><Globe2 className="h-3 w-3" /> Registered in</Label>
              <Input
                value={profile.registrationCountry}
                onChange={(e) => update('registrationCountry', e.target.value)}
                placeholder="e.g. Kenya"
                className="text-sm h-10"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1"><Target className="h-3 w-3" /> Sectors you work in</Label>
            <div className="flex flex-wrap gap-1.5">
              {SECTORS.map((s) => (
                <button key={s} type="button" onClick={() => toggleSector(s)}
                  className={cn('px-2.5 py-1.5 rounded-md text-xs border transition-all',
                    profile.sectors.includes(s) ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 font-medium' : 'border-border hover:border-amber-500/50')}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Mission statement</Label>
            <Textarea
              value={profile.mission}
              onChange={(e) => update('mission', e.target.value)}
              placeholder="e.g. To improve access to quality education for marginalized children in arid lands"
              className="text-sm min-h-[60px]"
            />
          </div>
        </Section>

        {/* Section 2: Operations */}
        <Section
          icon={Globe2}
          title="Operations"
          subtitle={[
            profile.operatingCountries.length ? profile.operatingCountries.join(', ') : null,
            profile.teamSize ? `Team: ${profile.teamSize}` : null,
            profile.budgetRange ? `Budget: ${profile.budgetRange}` : null,
          ].filter(Boolean).join(' • ') || 'Not set'}
          open={openSections.operations}
          onToggle={() => setOpenSections((s) => ({ ...s, operations: !s.operations }))}
        >
          <div className="space-y-1">
            <Label className="text-xs">Operating countries</Label>
            <div className="flex gap-2">
              <Input
                value={operatingCountry}
                onChange={(e) => setOperatingCountry(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCountry())}
                placeholder="Add country..."
                className="text-sm h-10 flex-1"
              />
              <Button type="button" variant="outline" onClick={addCountry} className="gap-1">
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
            {profile.operatingCountries.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {profile.operatingCountries.map((c) => (
                  <Badge key={c} variant="outline" className="text-xs gap-1 py-1">
                    {c}
                    <button onClick={() => removeCountry(c)} className="text-muted-foreground hover:text-red-500 ml-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Operating geographies (districts, regions)</Label>
            <Input
              value={profile.operatingGeographies}
              onChange={(e) => update('operatingGeographies', e.target.value)}
              placeholder="e.g. Northern Kenya (Marsabit, Turkana, Samburu)"
              className="text-sm h-10"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Languages of operation</Label>
            <Input
              value={profile.languages}
              onChange={(e) => update('languages', e.target.value)}
              placeholder="e.g. English, Swahili, Telugu"
              className="text-sm h-10"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1"><Users className="h-3 w-3" /> Team size</Label>
              <Select value={profile.teamSize} onValueChange={(v) => update('teamSize', v)}>
                <SelectTrigger className="text-sm h-10"><SelectValue /></SelectTrigger>
                <SelectContent>{['1-10', '11-30', '31-100', '101-500', '500+'].map((s) => <SelectItem key={s} value={s} className="text-sm">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1"><DollarSign className="h-3 w-3" /> Annual budget</Label>
              <Select value={profile.budgetRange} onValueChange={(v) => update('budgetRange', v)}>
                <SelectTrigger className="text-sm h-10"><SelectValue /></SelectTrigger>
                <SelectContent>{BUDGET_RANGES.map((b) => <SelectItem key={b} value={b} className="text-sm">{b}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">M&E capacity</Label>
              <Select value={profile.meCapacity} onValueChange={(v) => update('meCapacity', v)}>
                <SelectTrigger className="text-sm h-10"><SelectValue /></SelectTrigger>
                <SelectContent>{['None', '1 M&E officer', '2-3 M&E officers', 'Dedicated M&E unit', 'External consultant'].map((s) => <SelectItem key={s} value={s} className="text-sm">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </Section>

        {/* Section 3: Donors & Past Results */}
        <Section
          icon={FileText}
          title="Donors & past results"
          subtitle={profile.keyDonors ? `Donors: ${profile.keyDonors}` : 'Not set'}
          open={openSections.donors}
          onToggle={() => setOpenSections((s) => ({ ...s, donors: !s.donors }))}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Key donors</Label>
              <Input
                value={profile.keyDonors}
                onChange={(e) => update('keyDonors', e.target.value)}
                placeholder="e.g. USAID, FCDO, Gates Foundation"
                className="text-sm h-10"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1"><FileText className="h-3 w-3" /> Reporting frameworks</Label>
              <Input
                value={profile.reportingFrameworks}
                onChange={(e) => update('reportingFrameworks', e.target.value)}
                placeholder="e.g. USAID ADS, FCDO AMR"
                className="text-sm h-10"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Past program results (key outcomes)</Label>
            <Textarea
              value={profile.pastResults}
              onChange={(e) => update('pastResults', e.target.value)}
              placeholder="e.g. 2022: Improved reading levels for 3,000 children in Turkana. 2023: Trained 150 teachers in FLN methods."
              className="text-sm min-h-[80px]"
            />
            <p className="text-[10px] text-muted-foreground">This helps the AI learn from your organization's experience.</p>
          </div>
        </Section>

        {/* Context preview */}
        {(profile.name || profile.sectors.length > 0 || profile.operatingCountries.length > 0) && (
          <Card className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border-amber-500/30">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-xs font-bold">Auto-included in all programs</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {profile.name && <span><strong>{profile.name}</strong></span>}
              {profile.sectors.length > 0 && <span> - {profile.sectors.join(', ')}</span>}
              {profile.operatingCountries.length > 0 && <span> - {profile.operatingCountries.join(', ')}</span>}
              {profile.budgetRange && <span> - {profile.budgetRange}</span>}
            </p>
          </Card>
        )}
      </main>

      {/* Sticky save bar at the bottom */}
      <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Button variant="outline" onClick={handleBack} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="flex-1 text-xs text-muted-foreground hidden sm:block">
            {dirty ? 'You have unsaved changes.' : hasProfile ? 'All changes saved.' : 'Fill in your organization details.'}
          </div>
          <Button
            onClick={handleSave}
            disabled={!canSave}
            className="gap-2 bg-amber-600 hover:bg-amber-700 text-white ml-auto"
          >
            <Check className="h-4 w-4" /> {dirty ? 'Save' : (hasProfile ? 'Saved' : 'Save & start building')}
          </Button>
        </div>
      </div>
    </div>
  )
}
