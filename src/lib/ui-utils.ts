/* ─── UI Utilities — Telos Labs v8.0 ─── */

/**
 * Safely converts a value to a finite number.
 * Null, undefined, NaN, and Infinity all return 0.
 *
 * @param v - The value to convert.
 * @returns A finite number.
 */
export function toNumber(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Formats a number as a localized currency string (en-CA).
 *
 * @param value - The numeric value to format.
 * @param currency - ISO 4217 currency code (default 'CAD').
 * @returns The formatted currency string (e.g. "$1,234.56").
 */
export function formatCurrency(value: number, currency = 'CAD'): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: currency || 'CAD',
  }).format(Number.isFinite(value) ? value : 0);
}

/**
 * Parses a `YYYY-MM-DD` date string into a localized human-readable format.
 *
 * @param value - The date string to format.
 * @returns A formatted date like "Jan 15, 2025", or "No date" / the raw string on failure.
 */
export function formatDate(value?: string | null): string {
  if (!value) return 'No date';
  const parts = value.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return value;
  const [year, month, day] = parts;
  return new Date(year, month - 1, day).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/* ─── Category Colors (maps to --chart-* CSS variables) ─── */

const CATEGORY_CLASSES: Record<string, string> = {
  'Job Materials': 'bg-chart-1/15 text-chart-1 border-chart-1/20',
  'Subcontractors': 'bg-chart-2/15 text-chart-2 border-chart-2/20',
  'Site Fuel': 'bg-chart-3/15 text-chart-3 border-chart-3/20',
  'Equipment Rental': 'bg-chart-4/15 text-chart-4 border-chart-4/20',
  'Small Tools': 'bg-chart-5/15 text-chart-5 border-chart-5/20',
  'Vehicle Maintenance': 'bg-chart-6/15 text-chart-6 border-chart-6/20',
  'Travel/Lodging': 'bg-chart-7/15 text-chart-7 border-chart-7/20',
  'Office/Admin': 'bg-chart-8/15 text-chart-8 border-chart-8/20',
  'Office Supplies': 'bg-emerald-success/15 text-emerald-success border-emerald-success/20',
  'Meals & Entertainment': 'bg-chart-4/15 text-chart-4 border-chart-4/20',
  Travel: 'bg-chart-7/15 text-chart-7 border-chart-7/20',
  Fuel: 'bg-chart-3/15 text-chart-3 border-chart-3/20',
  'Professional Fees': 'bg-chart-2/15 text-chart-2 border-chart-2/20',
  Supplies: 'bg-chart-5/15 text-chart-5 border-chart-5/20',
  'Software & Subscriptions': 'bg-chart-6/15 text-chart-6 border-chart-6/20',
  Utilities: 'bg-chart-4/15 text-chart-4 border-chart-4/20',
};

const FALLBACK_CLASS = 'bg-chart-1/15 text-chart-1 border-chart-1/20';

/**
 * Returns Tailwind classes for a category badge with a consistent color.
 *
 * @param category - The expense category name.
 * @returns Tailwind utility classes for background, text, and border.
 */
export function categoryColor(category?: string | null): string {
  return CATEGORY_CLASSES[category ?? ''] ?? FALLBACK_CLASS;
}

/* ─── AI Confidence Tone ─── */

/**
 * Returns pill and panel Tailwind classes based on an AI confidence score.
 *
 * @param score - The confidence score (0–100).
 * @returns Classes for pill, panel, and a human-readable label.
 */
export function confidenceTone(score: number): { pill: string; panel: string; label: string } {
  if (score >= 85) {
    return {
      pill: 'bg-success/15 text-success border-success/20',
      panel: 'bg-success/[0.06] border-success/20 text-success',
      label: 'High',
    };
  }
  if (score >= 60) {
    return {
      pill: 'bg-warning/15 text-warning border-warning/20',
      panel: 'bg-warning/[0.06] border-warning/20 text-warning',
      label: 'Medium',
    };
  }
  return {
    pill: 'bg-danger/15 text-danger border-danger/20',
    panel: 'bg-danger/[0.06] border-danger/20 text-danger',
    label: 'Low',
  };
}

/* ─── Approval Status Badge ─── */

/**
 * Returns Tailwind classes and a human label for an approval status.
 *
 * @param status - The approval status string.
 * @returns Classes and label for the badge.
 */
export function approvalBadge(status?: string | null): { cls: string; label: string } {
  const s = (status ?? '').toLowerCase();
  if (s === 'approved') {
    return { cls: 'bg-success/15 text-success border-success/20', label: 'Approved' };
  }
  if (s === 'rejected') {
    return { cls: 'bg-danger/15 text-danger border-danger/20', label: 'Rejected' };
  }
  return { cls: 'bg-warning/15 text-warning border-warning/20', label: 'Pending' };
}

/* ─── Reimbursement Badge ─── */

/**
 * Returns Tailwind classes and a human label for a reimbursement status.
 *
 * @param status - The reimbursement status string.
 * @returns Classes and label for the badge.
 */
export function reimbursementBadge(status?: string | null): { cls: string; label: string } {
  const s = (status ?? '').toLowerCase();
  if (s === 'approved') {
    return { cls: 'bg-success/15 text-success border-success/20', label: 'Reimbursed' };
  }
  if (s === 'rejected') {
    return { cls: 'bg-danger/15 text-danger border-danger/20', label: 'Denied' };
  }
  return { cls: 'bg-warning/15 text-warning border-warning/20', label: 'Pending' };
}

/* ─── Self-Healing Glow ─── */

/**
 * Determines whether a confidence score is in the "glow" range (0 < score < 80).
 * Used to show a subtle visual hint on fields that need review.
 *
 * @param confidenceScore - The AI confidence score (0–100).
 * @returns True if the score is between 1 and 79 inclusive.
 */
export function shouldGlow(confidenceScore: number): boolean {
  return confidenceScore > 0 && confidenceScore < 80;
}

/* ─── Receipt Completeness Scoring ─── */

import type { ReceiptLineItem } from '@/components/scanner/types';

export interface CRAScoreInput {
  business_number: string;
  line_items: ReceiptLineItem[] | undefined;
  tax_amount: number;
  pst_amount: number;
  confidence_score: number;
  subtotal: number;
  total_amount: number;
  transaction_date: string;
}

/**
 * Calculates a receipt completeness score based on available data.
 * Returns a score from 0-100 based on six criteria:
 * 1. Business Number present (20 pts)
 * 2. Detailed line items exist (20 pts)
 * 3. Tax amounts present (20 pts)
 * 4. Valid receipt date (10 pts)
 * 5. Image quality score above threshold (15 pts) - using confidence score
 * 6. Mathematical accuracy (subtotal + taxes ≈ total) (15 pts)
 */
export function computeLiveCRAScore(form: CRAScoreInput): number {
  const score =
    (form.business_number?.trim() ? 20 : 0) + // Business Number present
    (form.line_items && form.line_items.length > 0 ? 20 : 0) + // Detailed line items
    ((form.tax_amount > 0 || form.pst_amount > 0) ? 20 : 0) + // Tax amounts present
    (form.transaction_date && !isNaN(Date.parse(form.transaction_date)) ? 10 : 0) + // Valid date
    (form.confidence_score >= 50 ? 15 : 0) + // Image quality (using confidence score)
    (Math.abs((form.subtotal + form.tax_amount + form.pst_amount) - form.total_amount) < 0.02 ? 15 : 0); // Math balance

  return score;
}
