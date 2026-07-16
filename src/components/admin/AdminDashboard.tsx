'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2, Users, Receipt, HardDrive, Activity, Trash2, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

// ─── Types ─────────────────────────────────────────────────────

interface TeamMember {
  userId: string;
  role: string;
  email: string;
  displayName: string;
  createdAt: string;
}

interface OrgAdminStats {
  receiptCount: number;
  userCount: number;
  storageBytes: number;
  recentReceipts: number;
}

// ─── Stat Card ──────────────────────────────────────────────────

function StatCard({ icon, label, value, loading }: { icon: React.ReactNode; label: string; value: string; loading: boolean }) {
  return (
    <div className="rounded-xl border border-glass-border bg-card p-4 transition hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-champagne/10 text-champagne">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-text-muted">{label}</p>
          {loading ? (
            <div className="mt-1 h-5 w-20 animate-pulse rounded bg-surface-hover" />
          ) : (
            <p className="text-lg font-bold tracking-tight tabular-nums text-text-primary">{value}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Admin Dashboard ───────────────────────────────────────────

/**
 * Admin dashboard with tabbed interface (Overview, Team Members, Activity Log).
 * Fetches org stats, team members, and recent audit activity.
 * Owner role required for team member management (remove users).
 */
export function AdminDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'activity'>('overview');
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery<OrgAdminStats>({
    queryKey: ['admin_stats'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('org_id')
        .eq('user_id', session.user.id)
        .single();

      const orgId = roleData?.org_id;
      if (!orgId) throw new Error('No organization');

      const { count: receiptCount } = await supabase
        .from('receipts')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('is_deleted', false);

      const { count: userCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId);

      // Count receipts created in last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { count: recentReceipts } = await supabase
        .from('receipts')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('is_deleted', false)
        .gte('created_at', thirtyDaysAgo);

      return {
        receiptCount: receiptCount ?? 0,
        userCount: userCount ?? 0,
        storageBytes: 0, // Calculated from storage API if needed
        recentReceipts: recentReceipts ?? 0,
      };
    },
    staleTime: 30_000,
  });

  // Fetch team members
  const { data: team, isLoading: teamLoading } = useQuery<{ members: TeamMember[]; callerRole: string }>({
    queryKey: ['team'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const res = await fetch('/api/team', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error('Failed to load team');
      return res.json();
    },
    staleTime: 15_000,
  });

  // Remove user mutation
  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

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
        throw new Error(data.error || 'Failed to remove user');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      queryClient.invalidateQueries({ queryKey: ['admin_stats'] });
      toast.success('Team member removed');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
    onSettled: () => {
      setRemovingId(null);
    },
  });

  // Fetch recent activity
  const { data: recentActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['recent_activity'],
    queryFn: async () => {
      const orgId = await supabase.rpc('get_user_org').then(r => r.data as string | null);
      if (!orgId) return [];

      const { data } = await supabase
        .from('audit_logs')
        .select('id, action, table_name, record_id, actor_id, created_at, metadata')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(20);

      return data ?? [];
    },
    staleTime: 30_000,
  });

  const isOwner = team?.callerRole === 'Owner';
  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Activity },
    { id: 'users' as const, label: 'Team Members', icon: Users },
    { id: 'activity' as const, label: 'Activity Log', icon: Receipt },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text-primary">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-text-secondary">Monitor your organization and manage team members.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-surface p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-card text-text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <StatCard
            icon={<Receipt className="h-5 w-5" />}
            label="Total Receipts"
            value={stats?.receiptCount.toLocaleString() ?? '—'}
            loading={statsLoading}
          />
          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="Team Members"
            value={stats?.userCount.toLocaleString() ?? '—'}
            loading={statsLoading}
          />
          <StatCard
            icon={<Activity className="h-5 w-5" />}
            label="Receipts (30d)"
            value={stats?.recentReceipts.toLocaleString() ?? '—'}
            loading={statsLoading}
          />
          <StatCard
            icon={<HardDrive className="h-5 w-5" />}
            label="Storage"
            value={stats && stats.storageBytes > 0 ? `${(stats.storageBytes / 1024 / 1024).toFixed(1)} MB` : '—'}
            loading={statsLoading}
          />
        </motion.div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {teamLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-champagne" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-text-muted">
                  {team?.members.length ?? 0} team member{(team?.members.length ?? 0) !== 1 ? 's' : ''}
                </p>
              </div>

              {team?.members.map((member) => {
                const roleDisplay = member.role === 'Owner' ? 'Owner' : member.role;
                return (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between rounded-xl border border-glass-border bg-card px-4 py-3 transition hover:shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {member.displayName || member.email || 'Unknown'}
                      </p>
                      <p className="text-xs text-text-muted">
                        {member.email}
                        <span className="mx-2">·</span>
                        <span className={member.role === 'Owner' ? 'text-champagne font-medium' : ''}>
                          {roleDisplay}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-text-muted tabular-nums">
                        {new Date(member.createdAt).toLocaleDateString('en-CA')}
                      </span>

                      {isOwner && member.role !== 'Owner' && (
                        <button
                          type="button"
                          onClick={() => {
                            setRemovingId(member.userId);
                            removeMutation.mutate(member.userId);
                          }}
                          disabled={removingId === member.userId}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-danger/10 hover:text-danger transition disabled:opacity-40"
                          aria-label={`Remove ${member.displayName || member.email || 'member'} from team`}
                          title={`Remove ${member.displayName || member.email || 'member'} from team`}
                        >
                          {removingId === member.userId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {!team?.members.length && (
                <div className="flex flex-col items-center justify-center py-12 text-text-muted">
                  <Users className="mb-2 h-8 w-8" />
                  <p className="text-sm">No team members found</p>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          {activityLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-champagne" />
            </div>
          ) : (
            <>
              {recentActivity?.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-text-muted">
                  <Activity className="mb-2 h-8 w-8" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}

              {recentActivity?.map((entry: { id: string; action: string; table_name: string; record_id: string; actor_id: string; created_at: string; metadata?: Record<string, unknown> }) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-xl border border-glass-border bg-card px-4 py-2.5 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-text-primary">{entry.action}</span>
                    <span className="text-text-muted mx-1.5">on</span>
                    <span className="font-mono text-xs text-champagne">{entry.table_name}</span>
                    {entry.metadata && (
                      <span className="text-text-muted ml-2 text-xs">
                        {JSON.stringify(entry.metadata).slice(0, 60)}
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-text-muted tabular-nums">
                    {new Date(entry.created_at).toLocaleDateString('en-CA', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </>
          )}
        </motion.div>
      )}

      {!isOwner && activeTab === 'users' && (
        <div className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-text-secondary">
          <ShieldAlert className="h-5 w-5 shrink-0 text-warning" />
          Only organization Owners can manage team members.
        </div>
      )}
    </div>
  );
}
