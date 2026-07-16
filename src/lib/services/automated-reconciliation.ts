/**
 * Automated Reconciliation Engine - AI-powered bank-receipt matching
 * Automatically matches receipts to bank statements and flags discrepancies
 */

import type { ReceiptRow } from '@/lib/types';

interface BankTransaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  account: string;
}

interface ReconciliationResult {
  receiptId: string;
  bankTxId: string | null;
  confidence: number;
  matchType: 'exact' | 'fuzzy' | 'none';
  variance?: number;
}

/**
 * Automatically reconcile receipts to bank transactions
 * Uses fuzzy matching and amount variance analysis
 */
export function reconcileReceipts(
  receipts: ReceiptRow[],
  bankTransactions: BankTransaction[]
): ReconciliationResult[] {
  const results: ReconciliationResult[] = [];

  // Sort by amount for binary search optimization
  const sortedBank = [...bankTransactions].sort((a, b) => a.amount - b.amount);
  const sortedReceipts = [...receipts].sort((a, b) => Number(a.total_amount) - Number(b.total_amount));

  for (const receipt of sortedReceipts) {
    // Find closest matching bank transaction
    const idx = findInsertionIndex(sortedBank, Number(receipt.total_amount));
    const candidates = getRangeCandidates(sortedBank, idx, Number(receipt.total_amount));

    let bestMatch: BankTransaction | null = null;
    let bestConfidence = 0;

    for (const bankTx of candidates) {
      const confidence = calculateMatchConfidence(receipt, bankTx);
      if (confidence > bestConfidence && confidence >= 60) {
        bestConfidence = confidence;
        bestMatch = bankTx;
      }
    }

    results.push({
      receiptId: receipt.id,
      bankTxId: bestMatch?.id ?? null,
      confidence: bestConfidence,
      matchType: bestMatch ? (bestConfidence > 80 ? 'exact' : 'fuzzy') : 'none',
      variance: bestMatch ? Math.abs(Number(receipt.total_amount) - bestMatch.amount) : undefined,
    });
  }

  return results;
}

/**
 * Calculate match confidence between receipt and bank transaction
 */
function calculateMatchConfidence(receipt: ReceiptRow, bankTx: BankTransaction): number {
  let score = 0;

  // Date proximity (within 3 days = full points)
  const receiptDate = new Date(receipt.transaction_date ?? '');
  const bankDate = new Date(bankTx.date);
  const dayDiff = Math.abs(receiptDate.getTime() - bankDate.getTime()) / 86400000;
  if (dayDiff <= 3) score += 30;
  else if (dayDiff <= 7) score += 15;

  // Amount match
  const amountDiff = Math.abs(Number(receipt.total_amount) - bankTx.amount);
  if (amountDiff === 0) score += 40;
  else if (amountDiff <= 1) score += 30;
  else if (amountDiff <= 5) score += 15;

  // Vendor name fuzzy match
  const vendorLower = (receipt.vendor_name ?? '').toLowerCase();
  const descLower = bankTx.description.toLowerCase();
  if (vendorLower && descLower) {
    const commonWords = vendorLower
      .split(/\s+/)
      .filter(word => descLower.includes(word) && word.length > 3);
    score += Math.min(commonWords.length * 5, 20);
  }

  return Math.min(score, 100);
}

/**
 * Binary search for insertion index
 */
function findInsertionIndex(arr: BankTransaction[], amount: number): number {
  let low = 0;
  let high = arr.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (arr[mid].amount < amount) low = mid + 1;
    else high = mid;
  }
  return low;
}

/**
 * Get nearby candidates for fuzzy matching
 */
function getRangeCandidates(
  arr: BankTransaction[],
  idx: number,
  _amount: number
): BankTransaction[] {
  const start = Math.max(0, idx - 5);
  const end = Math.min(arr.length, idx + 6);
  return arr.slice(start, end);
}

/**
 * Generate reconciliation report for audit purposes
 */
export function generateReconciliationReport(results: ReconciliationResult[]): {
  totalMatched: number;
  unmatchedReceipts: number;
  highConfidence: number;
  averageVariance: number;
} {
  const matched = results.filter(r => r.bankTxId);
  const unmatched = results.filter(r => !r.bankTxId);
  const highConfidence = matched.filter(r => r.confidence >= 80);
  const variances = matched.filter(r => r.variance).map(r => r.variance!);
  const avgVariance = variances.reduce((sum, v) => sum + v, 0) / variances.length;

  return {
    totalMatched: matched.length,
    unmatchedReceipts: unmatched.length,
    highConfidence: highConfidence.length,
    averageVariance: avgVariance || 0,
  };
}