/**
 * TimeHistory — Paginated list of past time entries.
 * Loads more on scroll/demand.
 */
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, ChevronDown, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTimeEntryHistory, type TimeEntry } from '@/lib/services/time-entries';

interface TimeHistoryProps {
  orgId: string;
}

const PAGE_SIZE = 20;

function formatDuration(clockIn: string, clockOut: string | null): string {
  const start = new Date(clockIn).getTime();
  const end = clockOut ? new Date(clockOut).getTime() : Date.now();
  const diff = end - start;
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export default function TimeHistory({ orgId }: TimeHistoryProps) {
  const [limit, setLimit] = useState(PAGE_SIZE);

  const { data: result, isLoading } = useQuery({
    queryKey: ['timeEntryHistory', orgId, limit],
    queryFn: () => getTimeEntryHistory(orgId, limit, 0),
  });

  const entries = result?.data ?? [];
  const hasMore = entries.length >= limit;

  function handleLoadMore() {
    setLimit((prev) => prev + PAGE_SIZE);
  }

  return (
    <div className="rounded-2xl border border-glass-border bg-card shadow-card">
      <div className="border-b border-glass-border px-6 py-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-champagne" />
          <h2 className="text-lg font-semibold text-foreground">History</h2>
        </div>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex animate-pulse items-center gap-4 rounded-xl border border-glass-border bg-surface-raised p-4">
                <div className="h-10 w-10 rounded-lg bg-glass-border" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 rounded bg-glass-border" />
                  <div className="h-3 w-20 rounded bg-glass-border" />
                </div>
                <div className="h-4 w-16 rounded bg-glass-border" />
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Clock className="h-10 w-10 text-text-muted" />
            <p className="text-sm text-text-muted">No time entries yet</p>
            <p className="text-xs text-text-muted">Your clock in/out history will appear here</p>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <AnimatePresence>
                {entries.map((entry: TimeEntry, i: number) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between rounded-lg border border-transparent px-4 py-3 transition-colors hover:border-glass-border hover:bg-surface-raised/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        entry.status === 'active' ? 'bg-emerald-success/20' : 'bg-surface-hover'
                      }`}>
                        <Clock className={`h-4 w-4 ${
                          entry.status === 'active' ? 'text-emerald-success' : 'text-text-muted'
                        }`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {formatDate(entry.clock_in_time)}
                        </p>
                        <p className="text-xs text-text-muted">
                          {formatTime(entry.clock_in_time)}
                          {entry.clock_out_time ? ` — ${formatTime(entry.clock_out_time)}` : ' — Active'}
                          {entry.notes ? ` · ${entry.notes}` : ''}
                        </p>
                      </div>
                    </div>
                    <p className="font-mono text-sm font-semibold tabular-nums text-foreground shrink-0 ml-4">
                      {formatDuration(entry.clock_in_time, entry.clock_out_time)}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {hasMore && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-glass-border bg-surface-raised px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-hover transition"
                >
                  <ChevronDown className="h-4 w-4" />
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
