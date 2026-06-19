'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Check, Globe2, Users, DollarSign, Target, FileText, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'
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

export default function OrganizationPage() {
  const router = useRouter()
  const existing = getOrgProfile()
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState<OrganizationProfile>(() => existing || {
    id: `org-${Date.now()}`, name: '', type: 'NGO (National)', registrationCountry: '',
    operatingCountries: [], operatingGeographies: '', sectors: [], mission: '',
    teamSize: '1-10', meCapacity: 'None', budgetRange: 'Under $50K',
    keyDonors: '', reportingFrameworks: '', languages: '', pastResults: '', updatedAt: '',
  })
  const [operatingCountry, setOperatingCountry] = useState('')

  const toggleSector = (sector: string) => {
    setProfile((p) => ({
      ...p,
      sectors: p.sectors.includes(sector) ? p.sectors.filter((s) => s !== sector) : [...p.sectors, sector],
    }))
  }

  const addCountry = () => {
    if (operatingCountry.trim() && !profile.operatingCountries.includes(operatingCountry.trim())) {
      setProfile((p) => ({ ...p, operatingCountries: [...p.operatingCountries, operatingCountry.trim()] }))
      setOperatingCountry('')
    }
  }

  const removeCountry = (country: string) => {
    setProfile((p) => ({ ...p, operatingCountries: p.operatingCountries.filter((c) => c !== country) }))
  }

  const handleSave = () => {
    storeOrgProfile({ ...profile, updatedAt: new Date().toISOString() })
    router.push('/')
  }

  const canContinue1 = profile.name.trim().length > 0
  const canContinue2 = profile.operatingCountries.length > 0 || profile.registrationCountry.trim().length > 0
  const canSave = profile.mission.trim().length > 0

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      {/* Top bar */}
      <header className="border-b border-border bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button onClick={() => router.push('/')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className={cn(
                'h-1.5 rounded-full transition-all',
                step >= s ? 'w-8 bg-amber-500' : 'w-4 bg-muted'
              )} />
            ))}
          </div>
          <span className="text-xs font-mono text-muted-foreground">Step {step}/3</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Step 1: Organization Identity */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-5 w-5 text-amber-600" />
                <h1 className="text-xl font-bold">Tell us about your organization</h1>
              </div>
              <p className="text-sm text-muted-foreground">This is used automatically in every strategy. Set once, used everywhere.</p>
            </div>

            <Card className="p-6 space-y-4">
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><Building2 className="h-3 w-3" /> Organization name *</Label>
                <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="e.g. Rural Education Action Program" className="text-sm h-10" autoFocus />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Select value={profile.type} onValueChange={(v) => setProfile({ ...profile, type: v })}>
                    <SelectTrigger className="text-sm h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>{ORG_TYPES.map((t) => <SelectItem key={t} value={t} className="text-sm">{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1"><Globe2 className="h-3 w-3" /> Registered in</Label>
                  <Input value={profile.registrationCountry} onChange={(e) => setProfile({ ...profile, registrationCountry: e.target.value })} placeholder="e.g. Kenya" className="text-sm h-10" />
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
                <Textarea value={profile.mission} onChange={(e) => setProfile({ ...profile, mission: e.target.value })} placeholder="e.g. To improve access to quality education for marginalized children in arid lands" className="text-sm min-h-[60px]" />
              </div>
            </Card>

            <Button onClick={() => setStep(2)} disabled={!canContinue1} className="w-full h-11 gap-2 bg-amber-600 hover:bg-amber-700 text-white">
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Where You Work */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Globe2 className="h-5 w-5 text-amber-600" />
                <h1 className="text-xl font-bold">Where do you operate?</h1>
              </div>
              <p className="text-sm text-muted-foreground">We'll search for demographic data and previous programs in these areas.</p>
            </div>

            <Card className="p-6 space-y-4">
              <div className="space-y-1">
                <Label className="text-xs">Operating countries</Label>
                <div className="flex gap-2">
                  <Input value={operatingCountry} onChange={(e) => setOperatingCountry(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCountry())} placeholder="Add country..." className="text-sm h-10 flex-1" />
                  <Button type="button" variant="outline" onClick={addCountry}>Add</Button>
                </div>
                {profile.operatingCountries.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {profile.operatingCountries.map((c) => (
                      <Badge key={c} variant="outline" className="text-xs gap-1 py-1">
                        {c}
                        <button onClick={() => removeCountry(c)} className="text-muted-foreground hover:text-red-500"><span className="text-xs">x</span></button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Operating geographies (districts, regions)</Label>
                <Input value={profile.operatingGeographies} onChange={(e) => setProfile({ ...profile, operatingGeographies: e.target.value })} placeholder="e.g. Northern Kenya (Marsabit, Turkana, Samburu)" className="text-sm h-10" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Languages of operation</Label>
                <Input value={profile.languages} onChange={(e) => setProfile({ ...profile, languages: e.target.value })} placeholder="e.g. English, Swahili, Telugu" className="text-sm h-10" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1"><Users className="h-3 w-3" /> Team size</Label>
                  <Select value={profile.teamSize} onValueChange={(v) => setProfile({ ...profile, teamSize: v })}>
                    <SelectTrigger className="text-sm h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>{['1-10', '11-30', '31-100', '101-500', '500+'].map((s) => <SelectItem key={s} value={s} className="text-sm">{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1"><DollarSign className="h-3 w-3" /> Annual budget</Label>
                  <Select value={profile.budgetRange} onValueChange={(v) => setProfile({ ...profile, budgetRange: v })}>
                    <SelectTrigger className="text-sm h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>{BUDGET_RANGES.map((b) => <SelectItem key={b} value={b} className="text-sm">{b}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">M&E capacity</Label>
                <Select value={profile.meCapacity} onValueChange={(v) => setProfile({ ...profile, meCapacity: v })}>
                  <SelectTrigger className="text-sm h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>{['None', '1 M&E officer', '2-3 M&E officers', 'Dedicated M&E unit', 'External consultant'].map((s) => <SelectItem key={s} value={s} className="text-sm">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-1.5"><ArrowLeft className="h-4 w-4" /> Back</Button>
              <Button onClick={() => setStep(3)} disabled={!canContinue2} className="flex-1 h-11 gap-2 bg-amber-600 hover:bg-amber-700 text-white">
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Donors & Past Results */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-5 w-5 text-amber-600" />
                <h1 className="text-xl font-bold">Donors & past results</h1>
              </div>
              <p className="text-sm text-muted-foreground">We'll align strategies to your donors' reporting frameworks.</p>
            </div>

            <Card className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Key donors</Label>
                  <Input value={profile.keyDonors} onChange={(e) => setProfile({ ...profile, keyDonors: e.target.value })} placeholder="e.g. USAID, FCDO, Gates Foundation" className="text-sm h-10" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1"><FileText className="h-3 w-3" /> Reporting frameworks</Label>
                  <Input value={profile.reportingFrameworks} onChange={(e) => setProfile({ ...profile, reportingFrameworks: e.target.value })} placeholder="e.g. USAID ADS, FCDO AMR" className="text-sm h-10" />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Past program results (key outcomes)</Label>
                <Textarea value={profile.pastResults} onChange={(e) => setProfile({ ...profile, pastResults: e.target.value })} placeholder="e.g. 2022: Improved reading levels for 3,000 children in Turkana. 2023: Trained 150 teachers in FLN methods." className="text-sm min-h-[80px]" />
                <p className="text-[10px] text-muted-foreground">This helps the AI learn from your organization's experience.</p>
              </div>
            </Card>

            {/* Summary preview */}
            <Card className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border-amber-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-bold">Ready to use</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Your organization context will be automatically included in every strategy.
                {profile.name && <span> <strong>{profile.name}</strong> -</span>}
                {profile.sectors.length > 0 && <span> {profile.sectors.join(', ')}</span>}
                {profile.operatingCountries.length > 0 && <span> - {profile.operatingCountries.join(', ')}</span>}
              </p>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="gap-1.5"><ArrowLeft className="h-4 w-4" /> Back</Button>
              <Button onClick={handleSave} className="flex-1 h-11 gap-2 bg-amber-600 hover:bg-amber-700 text-white">
                <Check className="h-4 w-4" /> Save & start building
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
