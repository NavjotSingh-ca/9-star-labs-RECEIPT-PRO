'use client';

import React, { useState } from 'react';
import { Users, Shield, Mail, UserPlus, Trash2 } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase, getOrgIdString } from '@/lib/supabase';

type TeamRole = 'admin' | 'accountant' | 'employee' | 'viewer';

interface TeamMember {
  id: string;
  email: string;
  role: TeamRole;
  created_at: string;
  invited_by?: string;
}

/**
 * TeamManagePanel - Role-based team management with invitations
 * Allows org admins to invite team members and manage permissions
 */
export default function TeamManagePanel() {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamRole>('employee');

  const { data: members, refetch } = useQuery({
    queryKey: ['team-members'],
    queryFn: async (): Promise<TeamMember[]> => {
      const orgId = await getOrgIdString();
      if (!orgId) return [];

      // Fetch organization members with roles
      const { data } = await supabase.rpc('get_org_members', { p_org_id: orgId });
      return (data ?? []) as TeamMember[];
    },
    staleTime: 60000,
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: TeamRole }) => {
      const orgId = await getOrgIdString();
      if (!orgId) throw new Error('No organization');

      // In production, this would call an API to send invitations
      const { error } = await supabase.rpc('invite_user_to_org', {
        p_org_id: orgId,
        p_email: email,
        p_role: role,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setInviteEmail('');
      setInviteRole('employee');
      refetch();
    },
  });

  const roleColors: Record<TeamRole, string> = {
    admin: 'text-danger',
    accountant: 'text-champagne',
    employee: 'text-emerald-light',
    viewer: 'text-text-muted',
  };

  return (
    <div className="space-y-6" role="region" aria-label="Team management">
      {/* Invite Form */}
      <div className="rounded-xl border border-glass-border bg-surface p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Invite Team Member
        </h3>
        <div className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder="email@company.com"
            className="flex-1 rounded-lg border border-glass-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-champagne/40"
            aria-label="Email address"
          />
          <select
            value={inviteRole}
            onChange={e => setInviteRole(e.target.value as TeamRole)}
            className="rounded-lg border border-glass-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-champagne/40"
            aria-label="Role to assign"
          >
            <option value="employee">Employee</option>
            <option value="accountant">Accountant</option>
            <option value="viewer">Viewer</option>
          </select>
          <button
            type="button"
            onClick={() => inviteMutation.mutate({ email: inviteEmail, role: inviteRole })}
            disabled={!inviteEmail || inviteMutation.isPending}
            className="rounded-lg bg-champagne px-4 py-2 text-sm font-bold text-obsidian transition hover:bg-champagne-dim disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-champagne/40"
            aria-label="Send invitation"
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Team Members List */}
      <div className="space-y-3" role="list">
        {members?.map(member => (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-xl border border-glass-border bg-surface p-3"
            role="listitem"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-champagne/15">
                <Users className="h-4 w-4 text-champagne" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">{member.email}</p>
                <p className="text-xs text-text-muted">Joined {new Date(member.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold ${roleColors[member.role]}`}>
                {member.role}
              </span>
              <button
                type="button"
                className="rounded-lg p-1.5 text-danger transition hover:bg-danger/10 focus:outline-none focus:ring-2 focus:ring-danger/40"
                aria-label={`Remove ${member.email} from team`}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Role Legend */}
      <div className="rounded-xl border border-glass-border bg-surface p-4">
        <h4 className="text-xs font-semibold text-text-primary mb-2">Role Permissions</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Shield className="h-3 w-3 text-danger" aria-hidden="true" />
            <span>Admin: Full access + team management</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-3 w-3 text-champagne" aria-hidden="true" />
            <span>Accountant: Edit receipts, export data</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-3 w-3 text-emerald-light" aria-hidden="true" />
            <span>Employee: Create/edit own receipts</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-3 w-3 text-text-muted" aria-hidden="true" />
            <span>Viewer: Read-only access</span>
          </div>
        </div>
      </div>
    </div>
  );
}