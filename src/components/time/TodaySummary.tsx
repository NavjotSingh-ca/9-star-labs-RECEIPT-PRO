/**
 * TodaySummary — Shows today's time entries with durations.
 * Accessed from the time tracking page below the clock card.
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Clock } from 'lucide-react';
import { getTodayEntries, type TimeEntry } from '@/lib/services/time-entries';

interface TodaySummaryProps {
  orgId: string;
}

function formatDuration(clockIn: string, clockOut: string | null, now: number): string {
  const start = new Date(clockIn).getTime();
  const end = clockOut ? new Date(clockOut).getTime() : now;
  const diff = end - start;
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatTimeDisplay(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function Skeleton() {
  return (
    <div className="space-y-2">
      {[1, 2].map((i) => (
        <div key={i} className="flex animate-pulse items-center gap-4 rounded-xl border border-glass-border bg-surface-raised p-4">
          <div className="h-10 w-10 rounded-lg bg-glass-border" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 rounded bg-glass-border" />
            <div className="h-3 w-24 rounded bg-glass-border" />
          </div>
          <div className="h-4 w-16 rounded bg-glass-border" />
        </div>
      ))}
    </div>
  );
}

export default function TodaySummary({ orgId }: TodaySummaryProps) {
  const { data: result, isLoading } = useQuery({
    queryKey: ['todayTimeEntries', orgId],
    queryFn: () => getTodayEntries(orgId),
    refetchInterval: 60000,
  });

  const entries = useMemo(() => result?.data ?? [], [result?.data]);

  // Update 'now' periodically so active entry durations update without re-fetching
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const { totalDisplay } = useMemo(() => {
    const ms = entries.reduce((acc, entry) => {
      const start = new Date(entry.clock_in_time).getTime();
      const end = entry.clock_out_time ? new Date(entry.clock_out_time).getTime() : now;
      return acc + (end - start);
    }, 0);
    const hours = ms / 3600000;
    const display = hours >= 1
      ? `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m`
      : `${Math.round(hours * 60)}m`;
    return { totalDisplay: display };
  }, [entries, now]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="rounded-2xl border border-glass-border bg-card shadow-card"
    >
      <div className="border-b border-glass-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-champagne" />
            <h2 className="text-lg font-semibold text-foreground">Today</h2>
          </div>
          {!isLoading && (
            <p className="font-mono text-sm font-semibold tabular-nums text-warning">
              {totalDisplay}
            </p>
          )}
        </div>
      </div>

      <div className="p-4">
        {isLoading ? (
          <Skeleton />
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Clock className="h-10 w-10 text-text-muted" />
            <p className="text-sm text-text-muted">No entries today</p>
            <p className="text-xs text-text-muted">Clock in above to start tracking your hours</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry: TimeEntry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-xl border border-glass-border bg-surface-raised p-4 transition-colors hover:bg-surface-hover"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-champagne/10">
                    <Clock className="h-5 w-5 text-champagne" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {formatTimeDisplay(entry.clock_in_time)}
                      {entry.clock_out_time && ` — ${formatTimeDisplay(entry.clock_out_time)}`}
                      {!entry.clock_out_time && (
                        <span className="ml-2 text-xs text-emerald-success font-medium">Active</span>
                      )}
                    </p>
                    <p className="text-xs text-text-muted">
                      {entry.notes || 'No notes'}
                    </p>
                  </div>
                </div>
                <p className="font-mono text-sm font-semibold tabular-nums text-foreground">
                  {formatDuration(entry.clock_in_time, entry.clock_out_time, now)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
