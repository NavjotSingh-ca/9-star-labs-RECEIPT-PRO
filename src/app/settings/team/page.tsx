'use client';

import { useState, useEffect, useCallback } from 'react';
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

export default function TeamSettings() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [callerRole, setCallerRole] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [removing, setRemoving] = useState<string | null>(null);
  const [changingRole, setChangingRole] = useState<string | null>(null);

  const loadTeam = useCallback(async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { setError('Not authenticated'); setLoading(false); return; }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { setError('Not authenticated'); setLoading(false); return; }

      const res = await fetch('/api/team', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) { setError('Failed to load team'); setLoading(false); return; }

      const data = await res.json();
      setMembers(data.members ?? []);
      setCallerRole(data.callerRole ?? '');
    } catch {
      setError('Failed to load team');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTeam(); }, [loadTeam]);

  const handleRemove = async (userId: string) => {
    setRemoving(userId);
    setError('');
    setSuccess('');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch('/api/team', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove member');
      }

      setMembers(prev => prev.filter(m => m.userId !== userId));
      setSuccess('Member removed');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setRemoving(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setChangingRole(userId);
    setError('');
    setSuccess('');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user?.id) return;

      await setUserRole(userId, newRole as 'Owner' | 'Accountant' | 'Employee', user.id);
      setMembers(prev => prev.map(m => m.userId === userId ? { ...m, role: newRole } : m));
      setSuccess('Role updated');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setChangingRole(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center" role="status" aria-live="polite" aria-label="Loading team">
        <Loader2 className="h-6 w-6 animate-spin text-champagne" />
      </div>
    );
  }

  const isOwner = callerRole === 'Owner';

  return (
    <div className="space-y-6">
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

      <div className="space-y-2">
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
                      disabled={changingRole === member.userId}
                      className="flex items-center gap-1.5 rounded-lg border border-glass-border bg-surface px-2.5 py-1.5 text-xs font-medium text-text-secondary transition hover:bg-surface-hover disabled:opacity-50"
                      onClick={() => {
                        const next = member.role === 'Employee' ? 'Accountant' : 'Employee';
                        handleRoleChange(member.userId, next);
                      }}
                    >
                      {changingRole === member.userId ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <UserCog className="h-3 w-3" />
                      )}
                      Change role
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={removing === member.userId}
                    className="flex items-center gap-1.5 rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-medium text-danger/70 transition hover:bg-danger/5 hover:text-danger disabled:opacity-50"
                    onClick={() => handleRemove(member.userId)}
                    title="Remove from organization"
                  >
                    {removing === member.userId ? (
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

        {members.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-12 text-text-muted">
            <Users className="mb-3 h-10 w-10 opacity-40" />
            <p className="text-sm font-medium">No team members yet</p>
            <p className="mt-1 text-xs">Invite team members from the side menu.</p>
          </div>
        )}
      </div>
    </div>
  );
}
