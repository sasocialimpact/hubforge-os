'use client'

import { useState } from 'react'
import { Building2, Check, Globe2, Users, DollarSign, Target, FileText, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  getOrgProfile, storeOrgProfile, getOrgContextBlock,
  ORG_TYPES, SECTORS, BUDGET_RANGES, type OrganizationProfile,
} from '@/lib/organization'
import { cn } from '@/lib/utils'

interface OrgSettingsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: (profile: OrganizationProfile) => void
}

function createEmpty(): OrganizationProfile {
  return {
    id: `org-${Date.now()}`, name: '', type: 'NGO (National)', registrationCountry: '',
    operatingCountries: [], operatingGeographies: '', sectors: [], mission: '',
    teamSize: '1-10', meCapacity: 'None', budgetRange: 'Under $50K',
    keyDonors: '', reportingFrameworks: '', languages: '', pastResults: '', updatedAt: '',
  }
}

export function OrgSettings({ open, onOpenChange, onSaved }: OrgSettingsProps) {
  // Lazy init from localStorage (runs once on mount)
  const [profile, setProfile] = useState<OrganizationProfile>(() => getOrgProfile() || createEmpty())
  const [operatingCountry, setOperatingCountry] = useState('')

  const handleSave = () => {
    const updated = { ...profile, updatedAt: new Date().toISOString() }
    storeOrgProfile(updated)
    onSaved?.(updated)
    onOpenChange(false)
  }

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col gap-0 p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-amber-600" />
            Organization Profile
          </DialogTitle>
          <DialogDescription className="text-xs">
            Set once. Used automatically in every strategy to align with your mission, donors, and capacity.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-5 py-4 max-h-[60vh]">
          <div className="space-y-4">
            {/* Basic info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><Building2 className="h-3 w-3" /> Organization name *</Label>
                <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="e.g. Rural Education Action Program" className="text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={profile.type} onValueChange={(v) => setProfile({ ...profile, type: v })}>
                  <SelectTrigger className="text-sm h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{ORG_TYPES.map((t) => <SelectItem key={t} value={t} className="text-sm">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><Globe2 className="h-3 w-3" /> Registered in</Label>
                <Input value={profile.registrationCountry} onChange={(e) => setProfile({ ...profile, registrationCountry: e.target.value })} placeholder="e.g. Kenya" className="text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><Users className="h-3 w-3" /> Team size</Label>
                <Select value={profile.teamSize} onValueChange={(v) => setProfile({ ...profile, teamSize: v })}>
                  <SelectTrigger className="text-sm h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['1-10', '11-30', '31-100', '101-500', '500+'].map((s) => <SelectItem key={s} value={s} className="text-sm">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Operating countries */}
            <div className="space-y-1">
              <Label className="text-xs">Operating countries</Label>
              <div className="flex gap-2">
                <Input value={operatingCountry} onChange={(e) => setOperatingCountry(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCountry())} placeholder="Add country..." className="text-sm flex-1" />
                <Button type="button" variant="outline" size="sm" onClick={addCountry}>Add</Button>
              </div>
              {profile.operatingCountries.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile.operatingCountries.map((c) => (
                    <Badge key={c} variant="outline" className="text-[10px] gap-1">
                      {c}
                      <button onClick={() => removeCountry(c)}><X className="h-2.5 w-2.5" /></button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Geographies */}
            <div className="space-y-1">
              <Label className="text-xs">Operating geographies (districts, regions)</Label>
              <Input value={profile.operatingGeographies} onChange={(e) => setProfile({ ...profile, operatingGeographies: e.target.value })} placeholder="e.g. Northern Kenya (Marsabit, Turkana, Samburu)" className="text-sm" />
            </div>

            {/* Sectors */}
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1"><Target className="h-3 w-3" /> Sectors</Label>
              <div className="flex flex-wrap gap-1.5">
                {SECTORS.map((s) => (
                  <button key={s} type="button" onClick={() => toggleSector(s)}
                    className={cn('px-2 py-1 rounded-md text-[11px] border transition-all',
                      profile.sectors.includes(s) ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300' : 'border-border hover:border-amber-500/50')}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Mission */}
            <div className="space-y-1">
              <Label className="text-xs">Mission statement</Label>
              <Textarea value={profile.mission} onChange={(e) => setProfile({ ...profile, mission: e.target.value })} placeholder="e.g. To improve access to quality education for marginalized children in arid lands" className="text-sm min-h-[50px]" />
            </div>

            {/* M&E capacity + budget */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">M&E capacity</Label>
                <Select value={profile.meCapacity} onValueChange={(v) => setProfile({ ...profile, meCapacity: v })}>
                  <SelectTrigger className="text-sm h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['None', '1 M&E officer', '2-3 M&E officers', 'Dedicated M&E unit', 'External consultant'].map((s) => <SelectItem key={s} value={s} className="text-sm">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><DollarSign className="h-3 w-3" /> Annual budget</Label>
                <Select value={profile.budgetRange} onValueChange={(v) => setProfile({ ...profile, budgetRange: v })}>
                  <SelectTrigger className="text-sm h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{BUDGET_RANGES.map((b) => <SelectItem key={b} value={b} className="text-sm">{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Donors + reporting */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Key donors</Label>
                <Input value={profile.keyDonors} onChange={(e) => setProfile({ ...profile, keyDonors: e.target.value })} placeholder="e.g. USAID, FCDO, Gates Foundation" className="text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><FileText className="h-3 w-3" /> Reporting frameworks</Label>
                <Input value={profile.reportingFrameworks} onChange={(e) => setProfile({ ...profile, reportingFrameworks: e.target.value })} placeholder="e.g. USAID ADS, FCDO AMR, Logframe" className="text-sm" />
              </div>
            </div>

            {/* Languages */}
            <div className="space-y-1">
              <Label className="text-xs">Languages of operation</Label>
              <Input value={profile.languages} onChange={(e) => setProfile({ ...profile, languages: e.target.value })} placeholder="e.g. English, Swahili, local languages" className="text-sm" />
            </div>

            {/* Past results */}
            <div className="space-y-1">
              <Label className="text-xs">Past program results (key outcomes)</Label>
              <Textarea value={profile.pastResults} onChange={(e) => setProfile({ ...profile, pastResults: e.target.value })} placeholder="e.g. 2022: Improved reading levels for 3,000 children in Turkana. 2023: Trained 150 teachers in FLN methods." className="text-sm min-h-[70px]" />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-5 py-3 border-t border-border shrink-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={!profile.name.trim()} className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5">
            <Check className="h-3.5 w-3.5" /> Save organization
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
