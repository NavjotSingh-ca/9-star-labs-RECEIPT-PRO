/**
 * TimeClock — Main clock in/out card. Inspired by crewclock.
 * Shows current time, elapsed time when clocked in, and a prominent CLOCK IN/OUT button.
 * Simple, minimal, no GPS/geofencing/breaks.
 */
'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, LogOut, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clockIn, clockOut, getActiveEntry } from '@/lib/services/time-entries';

interface TimeClockProps {
  orgId: string;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatElapsed(clockInTime: string): string {
  const diff = Date.now() - new Date(clockInTime).getTime();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function ElapsedTimer({ clockInTime }: { clockInTime: string }) {
  const [elapsed, setElapsed] = useState(() => formatElapsed(clockInTime));

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(formatElapsed(clockInTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [clockInTime]);

  return (
    <div className="text-center">
      <p className="text-xs font-medium text-text-muted">Elapsed</p>
      <p className="font-mono text-3xl font-bold tabular-nums text-warning">
        {elapsed}
      </p>
    </div>
  );
}

export default function TimeClock({ orgId }: TimeClockProps) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const { data: activeResult } = useQuery({
    queryKey: ['activeTimeEntry', orgId],
    queryFn: () => getActiveEntry(orgId),
    refetchInterval: 30000,
  });

  const clockInMutation = useMutation({
    mutationFn: () => clockIn(orgId, notes || undefined),
    onSuccess: (result) => {
      if (result.error) return;
      queryClient.invalidateQueries({ queryKey: ['activeTimeEntry', orgId] });
      queryClient.invalidateQueries({ queryKey: ['todayTimeEntries', orgId] });
      setNotes('');
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: () => {
      if (!activeResult?.data?.id) throw new Error('No active entry');
      return clockOut(orgId, activeResult.data.id, notes || undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeTimeEntry', orgId] });
      queryClient.invalidateQueries({ queryKey: ['todayTimeEntries', orgId] });
      setNotes('');
    },
  });

  const activeEntry = activeResult?.data;
  const isClockedIn = !!activeEntry;
  const errorMessage = activeResult?.error || clockInMutation.data?.error || clockOutMutation.data?.error;
  const isPending = clockInMutation.isPending || clockOutMutation.isPending;

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="overflow-hidden rounded-2xl border border-glass-border bg-card shadow-card">
        <div className="relative p-8">
          <div className="absolute inset-0 bg-gradient-to-b from-champagne/5 to-transparent pointer-events-none" />

          <div className="relative space-y-6">
            {/* Current time display */}
            <div className="text-center">
              <p className="text-sm font-medium text-text-secondary">{formatDate(currentTime)}</p>
              <p className="mt-1 font-mono text-5xl font-bold tracking-tight tabular-nums text-foreground">
                {formatTime(currentTime)}
              </p>
            </div>

            {/* Elapsed timer when clocked in */}
            <AnimatePresence mode="wait">
              {isClockedIn && activeEntry?.clock_in_time && (
                <motion.div
                  key="elapsed"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <ElapsedTimer clockInTime={activeEntry.clock_in_time} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Status indicator */}
            <div className="flex justify-center">
              {isClockedIn ? (
                <div className="flex items-center gap-2 text-sm text-emerald-success">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-success/75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-success" />
                  </span>
                  Clocked In
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <CheckCircle className="h-4 w-4" />
                  Ready to Clock In
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Add notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-glass-border bg-surface-raised px-4 py-3 text-sm text-foreground placeholder:text-text-muted transition-colors focus:border-champagne focus:outline-none focus:ring-1 focus:ring-champagne"
                aria-label="Clock notes"
              />

              {/* Error message */}
              <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main button */}
              <motion.button
                type="button"
                onClick={() => (isClockedIn ? clockOutMutation.mutate() : clockInMutation.mutate())}
                disabled={isPending}
                whileTap={{ scale: 0.97 }}
                className={`shimmer-scan relative flex w-full items-center justify-center gap-3 rounded-xl px-8 py-4 text-lg font-bold text-white shadow-button transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                  isClockedIn
                    ? 'bg-surface-hover text-danger hover:bg-danger hover:text-white'
                    : 'bg-champagne hover:brightness-110'
                }`}
                aria-label={isClockedIn ? 'Clock out' : 'Clock in'}
              >
                {isPending ? (
                  <Clock className="h-5 w-5 animate-spin" />
                ) : isClockedIn ? (
                  <>
                    <LogOut className="h-5 w-5" />
                    CLOCK OUT
                  </>
                ) : (
                  <>
                    <Clock className="h-5 w-5" />
                    CLOCK IN
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
