// Server-side organization management.
// Uses the platform Supabase client (service role) for all DB operations.

import { getPlatformClient, isSupabaseConfigured } from './platform-auth'

export interface Organization {
  id: string
  name: string
  slug: string
  created_by: string
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface OrgMember {
  id: string
  org_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  invited_by: string | null
  joined_at: string
}

// --- Create ---

export async function createOrganization(
  name: string,
  slug: string,
  userId: string,
): Promise<Organization | null> {
  const client = await getPlatformClient()
  if (!client) return null

  const { data: org, error } = await client
    .from('organizations')
    .insert({ name, slug, created_by: userId })
    .select()
    .single()

  if (error || !org) {
    console.error('[organizations] create error:', error)
    return null
  }

  // Add creator as owner
  await client.from('organization_members').insert({
    org_id: org.id,
    user_id: userId,
    role: 'owner',
    invited_by: userId,
  })

  return org as Organization
}

// --- Read ---

export async function getOrganization(orgId: string): Promise<Organization | null> {
  const client = await getPlatformClient()
  if (!client) return null

  const { data, error } = await client
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single()

  if (error || !data) return null
  return data as Organization
}

export async function getOrgMembers(orgId: string): Promise<OrgMember[]> {
  const client = await getPlatformClient()
  if (!client) return []

  const { data, error } = await client
    .from('organization_members')
    .select('*')
    .eq('org_id', orgId)
    .order('joined_at', { ascending: true })

  if (error || !data) return []
  return data as OrgMember[]
}

export async function getUserOrgs(userId: string): Promise<(Organization & { role: string })[]> {
  const client = await getPlatformClient()
  if (!client) return []

  const { data: memberships, error } = await client
    .from('organization_members')
    .select('org_id, role')
    .eq('user_id', userId)

  if (error || !memberships || memberships.length === 0) return []

  const orgIds = memberships.map((m: any) => m.org_id)
  const { data: orgs } = await client
    .from('organizations')
    .select('*')
    .in('id', orgIds)

  if (!orgs) return []

  const roleMap = new Map(memberships.map((m: any) => [m.org_id, m.role]))
  return orgs.map((org: any) => ({ ...org, role: roleMap.get(org.id) || 'member' }))
}

// --- Membership ---

export async function inviteMember(
  orgId: string,
  userId: string,
  role: 'admin' | 'member' | 'viewer',
  invitedBy: string,
): Promise<OrgMember | null> {
  const client = await getPlatformClient()
  if (!client) return null

  const { data, error } = await client
    .from('organization_members')
    .insert({ org_id: orgId, user_id: userId, role, invited_by: invitedBy })
    .select()
    .single()

  if (error) {
    console.error('[organizations] invite error:', error)
    return null
  }
  return data as OrgMember
}

export async function removeMember(orgId: string, userId: string): Promise<boolean> {
  const client = await getPlatformClient()
  if (!client) return false

  const { error } = await client
    .from('organization_members')
    .delete()
    .eq('org_id', orgId)
    .eq('user_id', userId)

  return !error
}

export async function updateMemberRole(
  orgId: string,
  userId: string,
  newRole: 'admin' | 'member' | 'viewer',
): Promise<boolean> {
  const client = await getPlatformClient()
  if (!client) return false

  const { error } = await client
    .from('organization_members')
    .update({ role: newRole })
    .eq('org_id', orgId)
    .eq('user_id', userId)

  return !error
}

// --- Authorization checks ---

export async function isOrgMember(orgId: string, userId: string): Promise<boolean> {
  const client = await getPlatformClient()
  if (!client) return false

  const { data } = await client
    .from('organization_members')
    .select('id')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .single()

  return !!data
}

export async function isOrgAdmin(orgId: string, userId: string): Promise<boolean> {
  const client = await getPlatformClient()
  if (!client) return false

  const { data } = await client
    .from('organization_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .single()

  return !!data && (data.role === 'owner' || data.role === 'admin')
}
