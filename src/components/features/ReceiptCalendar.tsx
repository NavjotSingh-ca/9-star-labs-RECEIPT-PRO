'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { supabase, getOrgIdString } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/ui-utils';
import type { ReceiptRow } from '@/lib/types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getMonthDays(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: Date[] = [];
  const startPad = first.getDay();
  for (let i = 0; i < startPad; i++) {
    days.push(new Date(year, month, -startPad + i + 1));
  }
  for (let i = 1; i <= last.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push(new Date(year, month + 1, i));
  }
  return days;
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function ReceiptCalendar() {
  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: orgId } = useQuery({
    queryKey: ['calendar-org-id'],
    queryFn: () => getOrgIdString(),
    staleTime: Infinity,
  });

  const { data: receipts = [], isLoading, error } = useQuery({
    queryKey: ['calendar-receipts', orgId],
    queryFn: async (): Promise<ReceiptRow[]> => {
      if (!orgId) return [];
      const { data, error: err } = await supabase
        .from('receipts')
        .select('*')
        .eq('org_id', orgId)
        .eq('is_deleted', false)
        .order('transaction_date', { ascending: false });
      if (err) throw new Error('Failed to load receipts');
      return (data || []) as ReceiptRow[];
    },
    enabled: !!orgId,
    staleTime: 60 * 1000,
  });

  const receiptMap = useMemo(() => {
    const map = new Map<string, ReceiptRow[]>();
    receipts.forEach((r) => {
      const d = r.transaction_date?.slice(0, 10);
      if (!d) return;
      const existing = map.get(d) || [];
      existing.push(r);
      map.set(d, existing);
    });
    return map;
  }, [receipts]);

  const days = useMemo(() => getMonthDays(currentYear, currentMonth), [currentYear, currentMonth]);

  const selectedReceipts = selectedDate ? receiptMap.get(selectedDate) || [] : [];

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDate(null);
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDate(null);
  }

  const monthLabel = new Date(currentYear, currentMonth).toLocaleDateString('en-CA', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-5 fade-in">
      <PageHeader title="Receipt Calendar" subtitle="View receipts by date" />

      {isLoading && (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-champagne" />
        </div>
      )}

      {error && (
        <div className="rounded-[2rem] bg-danger/10 p-4 text-sm text-danger border border-danger/20">
          <AlertCircle className="inline h-4 w-4 mr-2" />
          {error.message}
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div className="rounded-2xl border border-glass-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={prevMonth}
                className="rounded-xl p-2 text-text-muted hover:bg-surface hover:text-text-primary transition-colors"
                title="Previous month"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-bold tracking-tight text-text-primary">{monthLabel}</h2>
              <button
                type="button"
                onClick={nextMonth}
                className="rounded-xl p-2 text-text-muted hover:bg-surface hover:text-text-primary transition-colors"
                title="Next month"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {DAYS.map((d) => (
                <div key={d} className="py-1.5 text-center text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  {d}
                </div>
              ))}
              {days.map((d) => {
                const key = dateKey(d);
                const isCurrentMonth = d.getMonth() === currentMonth;
                const isToday = key === dateKey(today);
                const isSelected = key === selectedDate;
                const hasReceipts = receiptMap.has(key);

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDate(isSelected ? null : key)}
                    className={`
                      relative flex flex-col items-center justify-center rounded-xl py-2.5 text-sm transition-colors
                      ${!isCurrentMonth ? 'text-text-muted/30' : 'text-text-primary'}
                      ${isSelected ? 'bg-champagne/15 ring-1 ring-champagne' : isToday ? 'bg-surface' : 'hover:bg-surface'}
                    `}
                  >
                    <span className={isToday ? 'font-bold' : ''}>{d.getDate()}</span>
                    {hasReceipts && (
                      <span className="mt-0.5 flex gap-[3px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-champagne" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedDate && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-text-secondary">
                {formatDate(selectedDate)} · {selectedReceipts.length} receipt{selectedReceipts.length !== 1 ? 's' : ''}
              </p>
              {selectedReceipts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-glass-border bg-surface/30 py-8 text-center">
                  <p className="text-sm text-text-muted">No receipts for this date.</p>
                </div>
              ) : (
                selectedReceipts.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-xl border border-glass-border bg-card px-4 py-3 shadow-sm transition-colors hover:bg-surface/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-text-primary">
                        {r.vendor_name || 'Unknown'}
                      </p>
                      <p className="mt-0.5 text-xs text-text-muted">{r.category || 'Uncategorized'}</p>
                    </div>
                    <span className="ml-4 text-sm font-semibold tabular-nums text-text-primary">
                      {formatCurrency(r.total_amount, r.currency)}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
