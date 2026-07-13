'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ReceiptRow } from '@/lib/types';
import { toNumber, formatCurrency } from '@/lib/ui-utils';
import { parseBankStatement } from '@/app/actions/parse-bank-statement';
import { logError } from '@/lib/logger';
import PageHeader from '@/components/layout/PageHeader';
import { getBankTransactions, confirmBankMatch } from '@/lib/services/receipts';

interface BankReconciliationProps {
  receipts: ReceiptRow[];
}

export type BankRow = {
  id: string;
  date: string;
  description: string;
  amount: number;
  matched_receipt_id?: string | null;
  is_reconciled?: boolean;
};

type MatchResult = {
  bankRow: BankRow;
  receipt: ReceiptRow | null;
  score: number;
};

function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  
  if (a.length > b.length) {
    const tmp = a;
    a = b;
    b = tmp;
  }
  
  const row = Array.from({ length: a.length + 1 }, (_, i) => i);
  for (let i = 1; i <= b.length; i++) {
    let prev = i;
    for (let j = 1; j <= a.length; j++) {
      let val;
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        val = row[j - 1];
      } else {
        val = Math.min(row[j - 1] + 1, prev + 1, row[j] + 1);
      }
      row[j - 1] = prev;
      prev = val;
    }
    row[a.length] = prev;
  }
  return row[a.length];
}

export default function BankReconciliation({ receipts }: BankReconciliationProps) {
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const { data: bankData = [], isLoading: loading } = useQuery({
    queryKey: ['bank_transactions'],
    queryFn: async () => {
      const data = await getBankTransactions();
      return (data ?? []).map(d => ({
        id: d.id,
        date: d.date,
        description: d.description,
        amount: Number(d.amount),
        matched_receipt_id: d.matched_receipt_id,
        is_reconciled: d.is_reconciled,
      }));
    },
    staleTime: 30_000,
  });

  const confirmMutation = useMutation({
    mutationFn: async ({ bankTransactionId, receiptId, score }: { bankTransactionId: string; receiptId: string; score?: number }) => {
      await confirmBankMatch(bankTransactionId, receiptId, 'confirmed_fuzzy', score);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bank_transactions'] }),
    onError: () => setError('Failed to confirm match. Please try again.'),
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.includes(',') ? result.split(',')[1] : result);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      const res = await parseBankStatement(base64Data, file.name);
      if (!res.success) throw new Error(res.error);

      await queryClient.invalidateQueries({ queryKey: ['bank_transactions'] });

      if (res.duplicatesSkipped && res.duplicatesSkipped > 0) {
        setError(`${res.duplicatesSkipped} duplicate transaction(s) were skipped.`);
      }
    } catch (err) {
      logError(err, { action: 'parse_bank_file' });
      setError(err instanceof Error ? err.message : 'Failed to parse bank file.');
    }
  };

  const handleConfirmMatch = (bankTransactionId: string, receiptId: string, _isManual: boolean, score?: number) => {
    confirmMutation.mutate({ bankTransactionId, receiptId, score });
  };

  const matches: MatchResult[] = useMemo(() => {
    const sortedReceipts = [...receipts].sort((a, b) => toNumber(a.total_amount) - toNumber(b.total_amount));

    return bankData.map(bankRow => {
      // If already reconciled in DB
      if (bankRow.is_reconciled && bankRow.matched_receipt_id) {
        const exactReceipt = receipts.find(r => r.id === bankRow.matched_receipt_id);
        if (exactReceipt) {
          return { bankRow, receipt: exactReceipt, score: 100 };
        }
      }

      let bestMatch: ReceiptRow | null = null;
      let highestScore = 0;

      // Binary search to find the candidate range in O(log n)
      const findIndex = (amt: number) => {
        let low = 0, high = sortedReceipts.length;
        while (low < high) {
          const mid = (low + high) >>> 1;
          if (toNumber(sortedReceipts[mid].total_amount) < amt) low = mid + 1;
          else high = mid;
        }
        return low;
      };

      const startIdx = findIndex(bankRow.amount - 1.0);
      const endIdx = findIndex(bankRow.amount + 1.0);
      const candidates = sortedReceipts.slice(startIdx, endIdx);

      for (const receipt of candidates) {
        let score = 0;
        const receiptTotal = toNumber(receipt.total_amount);

        // Exact amount match is huge
        if (Math.abs(receiptTotal - bankRow.amount) < 0.05) score += 60;
        // Date match (exact is 20, 1 day off is 10)
        if (receipt.transaction_date === bankRow.date) {
          score += 20;
        } else if (receipt.transaction_date) {
          const rDate = new Date(receipt.transaction_date).getTime();
          const bDate = new Date(bankRow.date).getTime();
          if (Math.abs(rDate - bDate) <= 86400000) score += 10;
        }
        
        // Vendor name fuzzy match using Levenshtein
        const rName = (receipt.vendor_name || '').toLowerCase().trim();
        const bDesc = bankRow.description.toLowerCase().trim();
        if (rName && bDesc) {
          const distance = levenshteinDistance(rName, bDesc.substring(0, rName.length));
          if (distance === 0) score += 20;
          else if (distance <= 2) score += 15;
          else if (bDesc.includes(rName.substring(0, 4))) score += 10;
        }

        if (score > highestScore) {
          highestScore = score;
          bestMatch = receipt;
        }
      }

      return { bankRow, receipt: highestScore >= 60 ? bestMatch : null, score: highestScore };
    });
  }, [bankData, receipts]);

  const matchedCount = matches.filter(m => m.receipt).length;

  return (
    <div className="space-y-6 fade-in pb-10" role="region" aria-label="Bank reconciliation">
      <PageHeader
        title="Bank Reconciliation"
        subtitle="Upload a bank statement (PDF, OFX, QFX, or CSV) to AI-fuzzy match against receipts."
      />

      {bankData.length === 0 && !loading && (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-glass-border bg-surface/30 py-16 text-center" role="status" aria-live="polite">
          <FileSpreadsheet className="h-10 w-10 text-text-muted opacity-30" />
          <p className="text-sm text-text-muted">No bank transactions found. Upload a statement (PDF, OFX, QFX, or CSV).</p>
          <label className="mt-2 inline-flex cursor-pointer items-center justify-center gap-2 rounded-[2rem] bg-gradient-to-b from-[#dfcaaa] to-champagne px-4 py-3 text-sm font-bold text-black shadow-lg transition hover:opacity-90">
            <Upload className="h-4 w-4" />
            Upload File
            <input type="file" accept=".csv,.ofx,.qfx,application/pdf" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      )}

      {loading && (
        <div className="flex justify-center p-8" role="status" aria-live="polite" aria-label="Loading bank transactions">
          <RefreshCw className="h-8 w-8 animate-spin text-champagne" />
        </div>
      )}

      {error && (
        <div className="rounded-[2rem] border border-danger/20 bg-danger/[0.06] p-4 text-sm text-danger" role="alert">
          <AlertCircle className="inline h-4 w-4 mr-2 mb-0.5" />
          {error}
        </div>
      )}

      {bankData.length > 0 && !loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap rounded-[3rem] border border-glass-border bg-surface p-4 shadow-sm">
            <div>
              <p className="text-sm font-bold text-text-primary">Match Results</p>
              <p className="text-xs text-text-secondary">Found receipts for {matchedCount} out of {bankData.length} transactions.</p>
            </div>
            <label className="cursor-pointer inline-flex items-center gap-2 rounded-[2rem] bg-surface-raised px-4 py-2 text-xs font-semibold text-text-primary hover:bg-glass-border-hover border border-glass-border transition">
              <Upload className="h-3 w-3" />
              Upload More
              <input type="file" accept=".csv,.ofx,.qfx,application/pdf" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>

          <div className="space-y-3">
            {matches.map((m, idx) => (
              <motion.div 
                key={m.bankRow.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-[3rem] border border-glass-border bg-surface p-4 shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="min-w-0 md:w-[45%]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Bank Transaction</p>
                    <p className="mt-1 truncate text-sm font-semibold text-text-primary">{m.bankRow.description}</p>
                    <div className="mt-1 flex items-center gap-3">
                      <p className="text-xs text-text-secondary">{m.bankRow.date}</p>
                      <p className="text-sm font-bold tabular-nums text-text-secondary">{formatCurrency(m.bankRow.amount, 'CAD')}</p>
                    </div>
                  </div>

                  <div className="md:w-[50%] rounded-[2rem] border border-glass-border bg-surface-raised p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex justify-between">
                      <span>Receipt Match</span>
                      {m.bankRow.is_reconciled && <span className="text-emerald-light">Reconciled</span>}
                    </p>
                    {m.receipt ? (
                      <div className="mt-1">
                        <div className="flex items-center justify-between">
                          <p className="truncate text-sm font-medium text-text-primary">{m.receipt.vendor_name}</p>
                          <p className="text-sm font-bold tabular-nums text-champagne">{formatCurrency(toNumber(m.receipt.total_amount), 'CAD')}</p>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-light" />
                            <span className="text-[10px] font-bold text-emerald-light uppercase tracking-wide">
                              {m.bankRow.is_reconciled ? 'Exact Match' : `${m.score}% Match Score`}
                            </span>
                          </div>
                          
                          {!m.bankRow.is_reconciled && !m.bankRow.id.startsWith('csv-') && (
                            <button
                              type="button"
                              onClick={() => handleConfirmMatch(m.bankRow.id, m.receipt!.id, false, m.score)}
                              disabled={confirmMutation.isPending}
                              className="text-[10px] font-bold uppercase tracking-wider text-champagne hover:text-champagne-dim transition flex items-center gap-1 bg-surface rounded-full px-2 py-1 border border-glass-border"
                            >
                              {confirmMutation.isPending ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                              Confirm Match
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-warning" />
                          <span className="text-xs text-warning">No matching receipt found.</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
