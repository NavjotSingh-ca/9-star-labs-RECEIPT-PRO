/**
 * Fraud Detection Engine - Zero-cost ML-based anomaly detection
 * Uses statistical analysis and pattern matching to detect suspicious receipts
 */

import type { ReceiptRow } from '@/lib/types';

interface FraudScore {
  receiptId: string;
  score: number; // 0-100
  reasons: string[];
  flagged: boolean;
}

/**
 * Calculate fraud score for a receipt using statistical analysis
 */
export function calculateFraudScore(
  receipt: ReceiptRow,
  vendorHistory: ReceiptRow[],
  orgAverage: { amount: number; categoryCount: number }
): FraudScore {
  const reasons: string[] = [];
  let score = 0;

  // Amount-based checks
  if (receipt.total_amount > (orgAverage.amount * 5)) {
    score += 30;
    reasons.push('Amount 5x+ above average');
  } else if (receipt.total_amount > (orgAverage.amount * 2)) {
    score += 15;
    reasons.push('Amount 2x+ above average');
  }

  // Duplicate detection
  const duplicates = vendorHistory.filter(
    r => r.vendor_name === receipt.vendor_name && r.total_amount === receipt.total_amount
  );
  if (duplicates.length > 3) {
    score += 25;
    reasons.push('Repeated identical amounts');
  }

  // Round number suspicion (often indicates fake receipts)
  const isRoundHundred = receipt.total_amount > 100 && receipt.total_amount % 100 === 0;
  const isRoundTen = receipt.total_amount > 10 && receipt.total_amount % 10 === 0;
  if (isRoundHundred || isRoundTen) {
    score += 10;
    reasons.push('Suspiciously round amount');
  }

  // Missing business number on high-value receipt
  if (receipt.total_amount > 100 && !receipt.business_number) {
    score += 20;
    reasons.push('Missing business number on >$100 receipt');
  }

  // Category mismatch (e.g., gas station with "Entertainment" category)
  const categoryVendors = {
    'Vehicle': ['shell', 'esso', 'petro', 'gas', 'honda', 'toyota', 'ford'],
    'Meals & Entertainment': ['restaurant', 'cafe', 'mcdonald', 'starbucks', 'a&w'],
    'Travel': ['hotel', 'airline', 'uber', 'lyft', 'taxi'],
    'Office': ['staples', 'office', 'amazon', 'costco'],
  };

  for (const [category, keywords] of Object.entries(categoryVendors)) {
    if (category !== receipt.category) {
      if (keywords.some(k => receipt.vendor_name?.toLowerCase().includes(k))) {
        score += 20;
        reasons.push(`Potential category mismatch: ${category} expected`);
      }
    }
  }

  // Time-based anomalies (multiple receipts same minute)
  const sameMinute = vendorHistory.filter(
    r =>
      r.transaction_date === receipt.transaction_date &&
      r.created_at &&
      receipt.created_at &&
      Math.abs(new Date(r.created_at).getTime() - new Date(receipt.created_at).getTime()) < 60000
  );
  if (sameMinute.length > 2) {
    score += 30;
    reasons.push('Multiple receipts within 1 minute');
  }

  return {
    receiptId: receipt.id,
    score,
    reasons,
    flagged: score >= 50,
  };
}

/**
 * Batch fraud detection for reporting
 */
export function detectFraudPatterns(receipts: ReceiptRow[]): FraudScore[] {
  if (receipts.length < 5) return [];

  // Calculate org averages
  const totalAmount = receipts.reduce((sum, r) => sum + Number(r.total_amount), 0);
  const orgAverage = { amount: totalAmount / receipts.length, categoryCount: receipts.length };

  // Build vendor history map
  const vendorHistory = new Map<string, ReceiptRow[]>();
  receipts.forEach(r => {
    const vendor = r.vendor_name || 'unknown';
    if (!vendorHistory.has(vendor)) vendorHistory.set(vendor, []);
    vendorHistory.get(vendor)!.push(r);
  });

  // Score each receipt
  return receipts.map(receipt =>
    calculateFraudScore(
      receipt,
      vendorHistory.get(receipt.vendor_name || 'unknown') || [],
      orgAverage
    )
  );
}