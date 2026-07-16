/**
 * Validation Rules Engine - CRA-compliant receipt validation
 * Real-time validation with actionable suggestions
 */

import type { ReceiptRow } from '@/lib/types';

interface ValidationResult {
  field: string;
  error?: string;
  warning?: string;
  suggestion?: string;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Validate receipt for CRA compliance
 */
export function validateReceipt(receipt: ReceiptRow): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Business number validation (for >$100)
  if (receipt.total_amount > 100 && !receipt.business_number) {
    results.push({
      field: 'business_number',
      warning: 'Business number required for receipts over $100',
      suggestion: 'Add vendor business number for CRA compliance',
      severity: 'warning',
    });
  }

  // Tax validation
  const totalTax = (receipt.tax_amount || 0) + (receipt.pst_amount || 0);
  if (totalTax && receipt.total_amount && totalTax > receipt.total_amount * 0.1) {
    results.push({
      field: 'tax_amount',
      error: 'Tax amount seems high (over 10% of total)',
      suggestion: 'Verify GST/PST calculation',
      severity: 'error',
    });
  }

  // Date validation
  const txDate = new Date(receipt.transaction_date ?? '');
  const createdDate = receipt.created_at ? new Date(receipt.created_at) : new Date();
  if (txDate > createdDate) {
    results.push({
      field: 'transaction_date',
      error: 'Transaction date is in the future',
      severity: 'error',
    });
  }

  // Suspicious round amounts
  const roundThreshold = 100;
  if (receipt.total_amount >= roundThreshold) {
    const isRound = receipt.total_amount % roundThreshold === 0;
    if (isRound) {
      results.push({
        field: 'total_amount',
        warning: 'Suspiciously round amount detected',
        suggestion: 'Verify receipt amount matches physical document',
        severity: 'warning',
      });
    }
  }

  // Missing notes (especially for Quebec)
  if (!receipt.notes) {
    results.push({
      field: 'notes',
      warning: 'Notes field is empty',
      suggestion: 'Add details for future audit purposes',
      severity: 'info',
    });
  }

  // Category consistency check
  if (receipt.vendor_name && receipt.category) {
    const vendorLower = receipt.vendor_name.toLowerCase();
    const categoryVendors = {
      'Vehicle': ['gas', 'petro', 'honda', 'toyota', 'uber'],
      'Meals & Entertainment': ['restaurant', 'cafe', 'mcdonalds', 'starbucks'],
      'Travel': ['hotel', 'airline', 'westjet', 'air canada'],
    };

    for (const [cat, keywords] of Object.entries(categoryVendors)) {
      if (keywords.some(k => vendorLower.includes(k)) && receipt.category !== cat) {
        results.push({
          field: 'category',
          warning: `Category mismatch: ${cat} might be more appropriate`,
          suggestion: `Consider changing to ${cat}`,
          severity: 'warning',
        });
      }
    }
  }

  return results;
}

/**
 * Get data completeness score
 */
export function getDataCompleteness(receipt: ReceiptRow): number {
  const fields = [
    'vendor_name',
    'total_amount',
    'transaction_date',
    'category',
    'tax_amount',
    'pst_amount',
    'notes',
  ];
  const filled = fields.filter(f => {
    const val = receipt[f as keyof ReceiptRow];
    return val !== null && val !== undefined && val !== '';
  });
  return Math.round((filled.length / fields.length) * 100);
}