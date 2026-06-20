// Client-side team/organization types and localStorage helpers.

export interface Organization {
  id: string
  name: string
  slug: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  createdAt: string
}

export interface OrgMember {
  userId: string
  email: string
  name?: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  joinedAt: string
}

const ACTIVE_ORG_KEY = 'hubforge.activeOrg'

export function getActiveOrg(): Organization | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(ACTIVE_ORG_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

export function setActiveOrg(org: Organization): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(ACTIVE_ORG_KEY, JSON.stringify(org))
  } catch {}
}

export function clearActiveOrg(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(ACTIVE_ORG_KEY)
  } catch {}
}
