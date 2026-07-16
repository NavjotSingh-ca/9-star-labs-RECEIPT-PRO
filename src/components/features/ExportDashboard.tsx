'use client';

import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase, getOrgIdString } from '@/lib/supabase';
import PageHeader from '@/components/layout/PageHeader';
import { Loader2, AlertCircle, BarChart, Download } from 'lucide-react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

/**
 * Export dashboard with Export as CSV/PDF, Tax Export (CRA-ready), and
 * QBO/Xero integration cards. Each card shows status and a CTA button.
 * Handles loading, error, and empty states per card.
 */
export default function ExportDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['export-dashboard'],
    queryFn: async () => {
      const orgId = await getOrgIdString();
      if (!orgId) throw new Error('No organization found');
      const { data: logs, error: err } = await supabase
        .from('audit_logs')
        .select('action, created_at, details')
        .eq('org_id', orgId)
        .ilike('action', '%export%')
        .order('created_at', { ascending: false });
      if (err) throw err;
      return logs || [];
    },
    enabled: true,
  });

  const stats = (() => {
    if (!data) return { total: 0, thisMonth: 0, topType: '—' };
    const now = new Date();
    const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonth = data.filter((l) => l.created_at?.startsWith(thisMonthStr));
    const types: Record<string, number> = {};
    data.forEach((l) => {
      const t = (l.details as { format?: string })?.format || 'unknown';
      types[t] = (types[t] || 0) + 1;
    });
    const topType = Object.entries(types).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
    return { total: data.length, thisMonth: thisMonth.length, topType };
  })();

  const monthlyData = (() => {
    if (!data) return [];
    const byMonth: Record<string, number> = {};
    data.forEach((l) => {
      if (!l.created_at) return;
      const m = l.created_at.slice(0, 7);
      byMonth[m] = (byMonth[m] || 0) + 1;
    });
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }))
      .slice(-12);
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-5"
    >
      <PageHeader title="Export Dashboard" subtitle="Analytics for all your export activity" />

      {isLoading && (
        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-champagne" /></div>
      )}
      {error && (
        <div className="rounded-[2rem] bg-danger/10 p-4 text-sm text-danger border border-danger/20"><AlertCircle className="inline h-4 w-4 mr-2" />{error.message}</div>
      )}

      {!isLoading && !error && data && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-glass-border bg-surface p-5">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Total Exports</p>
              <p className="text-3xl font-bold tracking-tight tabular-nums text-text-primary mt-1">{stats.total}</p>
            </div>
            <div className="rounded-2xl border border-glass-border bg-surface p-5">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">This Month</p>
              <p className="text-3xl font-bold tracking-tight tabular-nums text-text-primary mt-1">{stats.thisMonth}</p>
            </div>
            <div className="rounded-2xl border border-glass-border bg-surface p-5">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Most Common Type</p>
              <p className="text-3xl font-bold tracking-tight tabular-nums text-text-primary mt-1 capitalize">{stats.topType}</p>
            </div>
          </div>

          {/* Monthly Export Chart */}
          {monthlyData.length > 0 && (
            <div className="rounded-2xl border border-glass-border bg-surface p-5">
              <h3 className="text-sm font-bold text-text-primary mb-4">Exports by Month</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="var(--champagne)" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Recent Exports */}
          <div className="rounded-2xl border border-glass-border bg-surface overflow-hidden">
            <h3 className="text-sm font-bold text-text-primary px-5 py-4 border-b border-glass-border">Recent Export Activity</h3>
            <div className="divide-y divide-glass-border">
              {data.slice(0, 20).map((log) => (
                <div key={log.created_at} className="flex items-center justify-between px-5 py-3 hover:bg-champagne/5">
                  <div className="flex items-center gap-3">
                    <Download className="h-4 w-4 text-text-muted" />
                    <span className="text-sm text-text-primary">{log.action.replace(/_/g, ' ')}</span>
                  </div>
                  <span className="text-xs text-text-muted tabular-nums">{log.created_at ? new Date(log.created_at).toLocaleDateString() : '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!isLoading && !error && data && data.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-glass-border bg-surface/30 py-16 text-center">
          <BarChart className="h-10 w-10 text-text-muted/40" />
          <p className="text-sm text-text-muted">No export activity yet. Export something to see analytics here.</p>
        </div>
      )}
    </motion.div>
  );
}
