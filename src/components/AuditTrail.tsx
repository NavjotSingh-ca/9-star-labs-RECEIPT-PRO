'use client';

import React from 'react';
import {
  AlertCircle,
  ChevronDown,
  Download,
  Edit3,
  Eye,
  FilePlus2,
  Fingerprint,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/ui-utils';
import { Button } from '@/components/ui/button';
import type { AuditLogRow } from '@/lib/types';

const PAGE_SIZE = 50;

function getActionMeta(action?: string) {
  const normalized = (action ?? '').toLowerCase();

  if (normalized.includes('export')) {
    return {
      label: 'Export',
      icon: <Download className="h-4 w-4" />,
      pill: 'bg-champagne/15 text-champagne border-champagne/20',
      iconWrap: 'bg-champagne/15 text-champagne',
    };
  }

  if (
    normalized.includes('create') ||
    normalized.includes('scan') ||
    normalized.includes('add') ||
    normalized.includes('save')
  ) {
    return {
      label: 'Create',
      icon: <FilePlus2 className="h-4 w-4" />,
      pill: 'bg-emerald-success/15 text-emerald-light border-emerald-success/20',
      iconWrap: 'bg-emerald-success/15 text-emerald-light',
    };
  }

  if (normalized.includes('edit') || normalized.includes('update')) {
    return {
      label: 'Edit',
      icon: <Edit3 className="h-4 w-4" />,
      pill: 'bg-warning/15 text-warning border-warning/20',
      iconWrap: 'bg-warning/15 text-warning',
    };
  }

  if (normalized.includes('delete') || normalized.includes('remove')) {
    return {
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      pill: 'bg-danger/15 text-danger border-danger/20',
      iconWrap: 'bg-danger/15 text-danger',
    };
  }

  if (normalized.includes('view') || normalized.includes('open')) {
    return {
      label: 'View',
      icon: <Eye className="h-4 w-4" />,
      pill: 'bg-champagne/15 text-champagne border-champagne/20',
      iconWrap: 'bg-champagne/15 text-champagne',
    };
  }

  return {
    label: 'Integrity',
    icon: <Fingerprint className="h-4 w-4" />,
    pill: 'bg-surface-raised text-text-secondary border-glass-border',
    iconWrap: 'bg-surface-raised text-text-secondary',
  };
}

interface PageResult {
  logs: AuditLogRow[];
  nextOffset: number | undefined;
}

async function fetchAuditLogsPage({ pageParam = 0 }): Promise<PageResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) return { logs: [], nextOffset: undefined };

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .range(pageParam, pageParam + PAGE_SIZE - 1);

  if (error) throw error;
  const logs = (data ?? []) as AuditLogRow[];
  const nextOffset = logs.length < PAGE_SIZE ? undefined : pageParam + PAGE_SIZE;
  return { logs, nextOffset };
}

export default function AuditTrail() {
  const {
    data: pages,
    isLoading,
    error,
    refetch,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    initialPageParam: 0,
    queryKey: ['audit_logs'],
    queryFn: fetchAuditLogsPage,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    staleTime: 30_000,
  });

  const logs = pages?.pages.flatMap((p) => p.logs) ?? [];

  return (
    <div className="space-y-4 fade-in" role="region" aria-label="Audit trail">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Audit Trail</h2>
          <p className="mt-0.5 text-sm text-text-secondary">
            View key record events, exports, and integrity-related actions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 rounded-[2rem] border border-glass-border bg-surface px-3 py-2 text-sm font-medium text-text-secondary shadow-sm transition hover:border-glass-border-hover hover:text-champagne disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="rounded-[3rem] border border-champagne/15 bg-champagne/[0.04] p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-champagne" />
          <div>
            <p className="text-sm font-semibold text-text-primary">Compliance record view</p>
            <p className="mt-1 text-sm leading-6 text-text-secondary">
              This screen helps show who did what and when, including export activity and saved receipt events.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-[3rem] border border-glass-border bg-surface">
          <Loader2 className="h-8 w-8 animate-spin text-champagne" />
          <p className="text-sm font-medium text-text-secondary">Loading audit events…</p>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-danger/20 bg-danger/[0.06] p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-danger" />
            <div>
              <p className="text-sm font-semibold text-danger">Could not load audit trail</p>
              <p className="mt-1 text-sm text-danger">{error instanceof Error ? error.message : 'Failed to load audit trail.'}</p>
            </div>
          </div>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-glass-border bg-surface/30 py-16 text-center" role="status" aria-live="polite">
          <ShieldCheck className="h-10 w-10 text-text-muted opacity-30" />
          <p className="text-sm text-text-muted">No audit events yet. Actions like saving or exporting receipts will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const meta = getActionMeta(log.action);

            return (
              <div
                key={log.id}
                className="rounded-[3rem] border border-glass-border bg-surface p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[2rem] ${meta.iconWrap}`}
                  >
                    {meta.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-text-primary">
                        {log.action || 'Unknown action'}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.pill}`}
                      >
                        {meta.label}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-text-muted">
                      {formatDate(log.created_at)}
                    </p>

                    {log.details && (
                      <p className="mt-3 text-sm leading-6 text-text-secondary">
                        {log.details}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {hasNextPage && (
            <div className="flex justify-center pt-2 pb-8">
              <Button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                variant="outline"
                className="px-8 font-bold"
              >
                {isFetchingNextPage ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ChevronDown className="mr-2 h-4 w-4" />
                )}
                Load More Events
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
