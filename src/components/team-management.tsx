'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, UserPlus, Trash2, Shield, Eye, UserCheck } from 'lucide-react'

interface Member {
  userId: string
  email?: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  joinedAt: string
}

interface TeamManagementProps {
  orgId: string
  orgName: string
  currentUserId: string
  currentUserRole: 'owner' | 'admin' | 'member' | 'viewer'
}

const ROLE_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  owner: { label: 'Owner', variant: 'default' },
  admin: { label: 'Admin', variant: 'secondary' },
  member: { label: 'Member', variant: 'outline' },
  viewer: { label: 'Viewer', variant: 'outline' },
}

const ROLE_ICONS: Record<string, typeof Shield> = {
  owner: Shield,
  admin: Shield,
  member: UserCheck,
  viewer: Eye,
}

export function TeamManagement({ orgId, orgName, currentUserId, currentUserRole }: TeamManagementProps) {
  const [open, setOpen] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member')
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState('')

  const canManage = currentUserRole === 'owner' || currentUserRole === 'admin'

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/organizations/${orgId}?userId=${currentUserId}`)
      if (res.ok) {
        const data = await res.json()
        setMembers(
          (data.members || []).map((m: any) => ({
            userId: m.user_id,
            email: m.user_id, // userId is used as identifier; email would come from profiles
            role: m.role,
            joinedAt: m.joined_at,
          })),
        )
      }
    } catch {
      setError('Failed to load members')
    } finally {
      setLoading(false)
    }
  }, [orgId, currentUserId])

  useEffect(() => {
    if (open) {
      fetchMembers()
    }
  }, [open, fetchMembers])

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviting(true)
    setError('')
    try {
      const res = await fetch(`/api/organizations/${orgId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: inviteEmail.trim(),
          role: inviteRole,
          invitedBy: currentUserId,
        }),
      })
      if (res.ok) {
        setInviteEmail('')
        fetchMembers()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to invite')
      }
    } catch {
      setError('Failed to invite member')
    } finally {
      setInviting(false)
    }
  }

  const handleRemove = async (userId: string) => {
    try {
      const res = await fetch(`/api/organizations/${orgId}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, requestedBy: currentUserId }),
      })
      if (res.ok) {
        fetchMembers()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to remove')
      }
    } catch {
      setError('Failed to remove member')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Users className="h-4 w-4" />
          Team
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-600" />
            {orgName} - Team
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Invite form (admin/owner only) */}
          {canManage && (
            <div className="flex gap-2">
              <Input
                placeholder="Email or user ID"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                className="flex-1"
              />
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleInvite}
                disabled={inviting || !inviteEmail.trim()}
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white gap-1"
              >
                <UserPlus className="h-4 w-4" />
                {inviting ? '...' : 'Add'}
              </Button>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {/* Members list */}
          <div className="divide-y rounded-lg border">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
            ) : members.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No members found</div>
            ) : (
              members.map((m) => {
                const RoleIcon = ROLE_ICONS[m.role] || UserCheck
                const badge = ROLE_BADGES[m.role] || ROLE_BADGES.member
                return (
                  <div key={m.userId} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-sm font-medium">
                        {(m.email || m.userId).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{m.email || m.userId}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(m.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={badge.variant} className="gap-1">
                        <RoleIcon className="h-3 w-3" />
                        {badge.label}
                      </Badge>
                      {canManage && m.role !== 'owner' && m.userId !== currentUserId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                          onClick={() => handleRemove(m.userId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
