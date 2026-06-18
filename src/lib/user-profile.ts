// User profile — stored in localStorage, synced to Supabase
export interface UserProfile { profileId: string; name: string; email: string; organization: string; country: string; role: string }
const PROFILE_KEY = 'hubforge.profile'
const PROFILE_ID_KEY = 'hubforge.profileId'

export function getProfileId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(PROFILE_ID_KEY)
  if (!id) { id = `u-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`; localStorage.setItem(PROFILE_ID_KEY, id) }
  return id
}
export function getProfile(): UserProfile | null { if (typeof window === 'undefined') return null; try { const raw = localStorage.getItem(PROFILE_KEY); if (raw) return JSON.parse(raw) } catch {} return null }
export function storeProfile(profile: UserProfile): void { if (typeof window === 'undefined') return; localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)) }
export async function syncProfile(profile: UserProfile): Promise<void> { try { await fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) }) } catch (e) { console.warn('[profile] sync failed:', e) } }

export const COUNTRIES = ['Afghanistan','Argentina','Australia','Bangladesh','Belgium','Brazil','Burkina Faso','Cambodia','Cameroon','Canada','Chad','Chile','China','Colombia','Democratic Republic of Congo','Denmark','Ecuador','Egypt','Ethiopia','Finland','France','Germany','Ghana','Greece','India','Indonesia','Iraq','Ireland','Israel','Italy','Japan','Jordan','Kenya','Lebanon','Liberia','Madagascar','Malawi','Malaysia','Mali','Mexico','Morocco','Mozambique','Myanmar','Nepal','Netherlands','New Zealand','Nigeria','Norway','Pakistan','Peru','Philippines','Poland','Portugal','Rwanda','Saudi Arabia','Senegal','Sierra Leone','Singapore','Somalia','South Africa','South Sudan','Spain','Sri Lanka','Sudan','Sweden','Switzerland','Syria','Tanzania','Thailand','Tunisia','Turkey','Uganda','Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','Vietnam','Yemen','Zambia','Zimbabwe','Other']
export const ROLES = ['Program Officer','Program Manager','Monitoring & Evaluation Specialist','Project Coordinator','Country Director','Researcher','Consultant','Government Official','Student','Volunteer','Other']
