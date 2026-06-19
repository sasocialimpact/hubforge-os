// Organization Profile - set once, auto-included in every strategy generation.
// Stored in Supabase (if configured) or localStorage fallback.

export interface OrganizationProfile {
  id: string
  name: string
  type: string
  registrationCountry: string
  operatingCountries: string[]
  operatingGeographies: string
  sectors: string[]
  mission: string
  teamSize: string
  meCapacity: string
  budgetRange: string
  keyDonors: string
  reportingFrameworks: string
  languages: string
  pastResults: string
  updatedAt: string
}

const ORG_KEY = 'hubforge.organization'

export function getOrgProfile(): OrganizationProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(ORG_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

export function storeOrgProfile(profile: OrganizationProfile): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(ORG_KEY, JSON.stringify(profile))
  } catch {}
}

export function getOrgContextBlock(profile: OrganizationProfile | null): string {
  if (!profile) return ''
  return `## Organization Context (auto-included)

### Organization
- Name: ${profile.name}
- Type: ${profile.type}
- Registered in: ${profile.registrationCountry}
- Operating in: ${profile.operatingCountries.join(', ')}
- Geographies: ${profile.operatingGeographies}
- Sectors: ${profile.sectors.join(', ')}
- Mission: ${profile.mission}
- Team size: ${profile.teamSize}
- M&E capacity: ${profile.meCapacity}
- Annual budget: ${profile.budgetRange}
- Key donors: ${profile.keyDonors}
- Reporting frameworks: ${profile.reportingFrameworks}
- Languages: ${profile.languages}

### Past Results
${profile.pastResults || 'Not specified'}

IMPORTANT: Align the strategy to this organization's mission, capacity, donors, and reporting frameworks. Reference the organization by name. Consider their past results and team capacity when setting targets.`
}

export const ORG_TYPES = [
  'NGO (National)', 'INGO (International)', 'CBO (Community Based)', 
  'Foundation', 'Government', 'Social Enterprise', 'University/Research', 'Consultancy', 'Other',
]

export const SECTORS = [
  'Education', 'Health', 'WASH', 'Agriculture', 'Livelihoods', 
  'Gender', 'Climate', 'Governance', 'Humanitarian Response', 'Other',
]

export const BUDGET_RANGES = [
  'Under $50K', '$50K - $250K', '$250K - $1M', '$1M - $5M', '$5M - $20M', 'Over $20M',
]
