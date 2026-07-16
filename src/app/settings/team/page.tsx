'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { setUserRole } from '@/lib/services/roles';
import {
  Loader2,
  Users,
  ShieldCheck,
  UserCircle2,
  Mail,
  CalendarDays,
  Trash2,
  Crown,
  UserCog,
  User,
  AlertCircle,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface TeamMember {
  userId: string;
  role: string;
  email: string;
  displayName: string;
  createdAt: string;
}

const roleLabels: Record<string, string> = {
  Owner: 'Owner',
  Accountant: 'Accountant',
  Employee: 'Employee',
};

const roleIcons: Record<string, React.ReactNode> = {
  Owner: <Crown className="h-3.5 w-3.5 text-warning" />,
  Accountant: <UserCog className="h-3.5 w-3.5 text-champagne" />,
  Employee: <User className="h-3.5 w-3.5 text-text-muted" />,
};

async function fetchTeam(): Promise<{ members: TeamMember[]; callerRole: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');

  const res = await fetch('/api/team', {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) throw new Error('Failed to load team');
  return res.json();
}

/**
 * Team settings page — displays organization members and allows Owner to manage roles.
 * Handles loading, error, and empty states for the team members list.
 */
export default function TeamSettings() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['team'],
    queryFn: fetchTeam,
    staleTime: 30_000,
  });

  const members = data?.members ?? [];
  const callerRole = data?.callerRole ?? '';
  const isOwner = callerRole === 'Owner';

  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const res = await fetch('/api/team', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to remove member');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      setSuccess('Member removed');
    },
    onError: (err: Error) => setError(err.message),
  });

  const roleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('Not authenticated');
      await setUserRole(userId, newRole as 'Owner' | 'Accountant' | 'Employee', user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      setSuccess('Role updated');
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleRemove = (userId: string) => removeMutation.mutate(userId);
  const handleRoleChange = (userId: string, newRole: string) => roleMutation.mutate({ userId, newRole });

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center" role="status" aria-live="polite" aria-label="Loading team">
        <Loader2 className="h-6 w-6 animate-spin text-champagne" />
      </div>
    );
  }

  return (
    <ErrorBoundary componentName="TeamSettings">
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-2">
          <Users className="h-5 w-5 text-champagne" />
          Team Members
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Manage who has access to your organization.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger" role="alert">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-success/20 bg-emerald-success/5 px-4 py-3 text-sm text-emerald-success" role="status" aria-live="polite">
          <ShieldCheck className="h-4 w-4 flex-shrink-0" />
          {success}
        </div>
      )}

      <div className="space-y-2" role="list" aria-label="Team members">
        {members.map((member) => (
          <div
            key={member.userId}
            className="flex items-center gap-4 rounded-xl border border-glass-border bg-card p-4 transition hover:border-glass-border-hover hover:shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-raised">
              {member.displayName
                ? <span className="text-sm font-bold text-text-primary">{member.displayName.charAt(0).toUpperCase()}</span>
                : <UserCircle2 className="h-5 w-5 text-text-muted" />
              }
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-text-primary truncate">
                  {member.displayName || member.email.split('@')[0]}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-surface-raised px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
                  {roleIcons[member.role] ?? null}
                  {roleLabels[member.role] || member.role}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-3 text-xs text-text-muted">
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {member.email}
                </span>
                {member.createdAt && (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {new Date(member.createdAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {isOwner && member.role !== 'Owner' && (
                <>
                  <div className="relative group">
                    <button
                      type="button"
                      disabled={roleMutation.isPending}
                      className="flex items-center gap-1.5 rounded-lg border border-glass-border bg-surface px-2.5 py-1.5 text-xs font-medium text-text-secondary transition hover:bg-surface-hover disabled:opacity-50"
                      onClick={() => {
                        const next = member.role === 'Employee' ? 'Accountant' : 'Employee';
                        handleRoleChange(member.userId, next);
                      }}
                      aria-label={`Change ${member.displayName || member.email}'s role from ${member.role} to ${member.role === 'Employee' ? 'Accountant' : 'Employee'}`}
                      title={`Switch to ${member.role === 'Employee' ? 'Accountant' : 'Employee'} role`}
                    >
                      {roleMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <UserCog className="h-3 w-3" />
                      )}
                      Change role
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={removeMutation.isPending}
                    className="flex items-center gap-1.5 rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-medium text-danger/70 transition hover:bg-danger/5 hover:text-danger disabled:opacity-50"
                    onClick={() => handleRemove(member.userId)}
                    title="Remove from organization"
                  >
                    {removeMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                    Remove
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {members.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-text-muted">
            <Users className="mb-3 h-10 w-10 opacity-40" />
            <p className="text-sm font-medium">No team members yet</p>
            <p className="mt-1 text-xs">Invite team members from the side menu.</p>
          </div>
        )}
      </div>
    </motion.div>
    </ErrorBoundary>
  );
}
