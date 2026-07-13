'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowUpDown, Loader2, Search } from 'lucide-react';

import { supabase, getOrgIdString } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/ui-utils';
import type { ReceiptRow } from '@/lib/types';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { useMediaQuery } from '@/hooks/use-media-query';
import PageHeader from '@/components/layout/PageHeader';

interface VendorAggregate {
  vendor_name: string;
  total_spend: number;
  transaction_count: number;
  average_amount: number;
  last_transaction: string;
  receipts: ReceiptRow[];
}

type SortKey = 'vendor_name' | 'total_spend' | 'transaction_count' | 'average_amount' | 'last_transaction';

function aggregateByVendor(receipts: ReceiptRow[]): VendorAggregate[] {
  const map = new Map<string, ReceiptRow[]>();
  receipts.forEach((r) => {
    const name = r.vendor_name || 'Unknown';
    const existing = map.get(name) || [];
    existing.push(r);
    map.set(name, existing);
  });

  return Array.from(map.entries()).map(([name, rs]) => {
    const total = rs.reduce((s, r) => s + (r.total_amount || 0), 0);
    return {
      vendor_name: name,
      total_spend: total,
      transaction_count: rs.length,
      average_amount: total / rs.length,
      last_transaction: rs.reduce((latest, r) =>
        (r.transaction_date || '') > latest ? (r.transaction_date || '') : latest,
        ''
      ),
      receipts: rs,
    };
  });
}

function VendorSparkline({ receipts: rs }: { receipts: ReceiptRow[] }) {
  const data = useMemo(() => {
    const sorted = [...rs]
      .filter((r) => r.transaction_date)
      .sort((a, b) => (a.transaction_date || '').localeCompare(b.transaction_date || ''))
      .slice(-14);
    return sorted.map((r) => ({
      date: r.transaction_date?.slice(5, 10) || '',
      amount: r.total_amount || 0,
    }));
  }, [rs]);

  if (data.length < 2) return <span className="text-[11px] text-text-muted">—</span>;

  return (
    <div className="h-8 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#bea98e"
            strokeWidth={1.5}
            dot={false}
          />
          <Tooltip
            contentStyle={{
              background: '#1a1a1a',
              border: '1px solid rgba(190, 169, 142, 0.2)',
              borderRadius: '8px',
              fontSize: '11px',
            }}
            formatter={(value: unknown) => [formatCurrency(Number(value ?? 0)), 'Amount']}
            labelStyle={{ color: '#a1a1aa' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function VendorAnalytics() {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('total_spend');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const isMobile = useMediaQuery('(max-width: 768px)');

  const { data: orgId } = useQuery({
    queryKey: ['vendor-analytics-org-id'],
    queryFn: () => getOrgIdString(),
    staleTime: Infinity,
  });

  const { data: receipts = [], isLoading, error } = useQuery({
    queryKey: ['vendor-analytics-receipts', orgId],
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

  const vendors = useMemo(() => aggregateByVendor(receipts), [receipts]);

  const filtered = useMemo(() => {
    if (!search) return vendors;
    const q = search.toLowerCase();
    return vendors.filter((v) => v.vendor_name.toLowerCase().includes(q));
  }, [vendors, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      let cmp: number;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        cmp = aVal.localeCompare(bVal);
      } else {
        cmp = (aVal as number) - (bVal as number);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  function SortIcon({ column }: { column: SortKey }) {
    return (
      <ArrowUpDown
        className={`ml-1 inline h-3 w-3 ${
          sortKey === column ? 'text-champagne' : 'text-text-muted'
        }`}
      />
    );
  }

  return (
    <div className="space-y-5 fade-in">
      <PageHeader title="Vendor Analytics" subtitle="Spend breakdown by vendor" />

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

      {!isLoading && !error && vendors.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-glass-border bg-surface/30 py-16 text-center">
          <p className="text-sm text-text-muted">No receipt data available for vendor analysis.</p>
        </div>
      )}

      {!isLoading && !error && vendors.length > 0 && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder="Filter vendors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-glass-border bg-surface py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-champagne"
            />
          </div>

          {isMobile ? (
            <div className="space-y-2">
              {sorted.map((v) => (
                <div
                  key={v.vendor_name}
                  className="rounded-xl border border-glass-border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-bold text-text-primary">{v.vendor_name}</p>
                    <VendorSparkline receipts={v.receipts} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className="text-text-muted">Total:</span>
                    <span className="text-right font-semibold tabular-nums">{formatCurrency(v.total_spend)}</span>
                    <span className="text-text-muted">Transactions:</span>
                    <span className="text-right font-semibold tabular-nums">{v.transaction_count}</span>
                    <span className="text-text-muted">Average:</span>
                    <span className="text-right font-semibold tabular-nums">{formatCurrency(v.average_amount)}</span>
                    <span className="text-text-muted">Last:</span>
                    <span className="text-right font-semibold tabular-nums">{formatDate(v.last_transaction)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-glass-border bg-card shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-glass-border bg-surface-raised">
                    <th
                      className="cursor-pointer px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-text-muted"
                      onClick={() => toggleSort('vendor_name')}
                    >
                      Vendor <SortIcon column="vendor_name" />
                    </th>
                    <th
                      className="cursor-pointer px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-muted"
                      onClick={() => toggleSort('total_spend')}
                    >
                      Total Spend <SortIcon column="total_spend" />
                    </th>
                    <th
                      className="cursor-pointer px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-muted"
                      onClick={() => toggleSort('transaction_count')}
                    >
                      Count <SortIcon column="transaction_count" />
                    </th>
                    <th
                      className="cursor-pointer px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-muted"
                      onClick={() => toggleSort('average_amount')}
                    >
                      Avg <SortIcon column="average_amount" />
                    </th>
                    <th
                      className="cursor-pointer px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-muted"
                      onClick={() => toggleSort('last_transaction')}
                    >
                      Last Transaction <SortIcon column="last_transaction" />
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-text-muted">
                      Trend
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((v, i) => (
                    <tr
                      key={v.vendor_name}
                      className={`border-b border-glass-border transition-colors hover:bg-champagne/5 ${
                        i % 2 === 0 ? 'bg-surface' : 'bg-surface-raised/50'
                      }`}
                    >
                      <td className="px-4 py-3 font-semibold text-text-primary max-w-[200px] truncate">
                        {v.vendor_name}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-text-primary">
                        {formatCurrency(v.total_spend)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-text-primary">
                        {v.transaction_count}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-text-primary">
                        {formatCurrency(v.average_amount)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-text-muted">
                        {formatDate(v.last_transaction)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end">
                          <VendorSparkline receipts={v.receipts} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
