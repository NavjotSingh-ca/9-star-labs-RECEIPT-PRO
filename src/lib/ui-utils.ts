/* ─── UI Utilities — Telos Labs v8.0 ─── */

export function toNumber(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function formatCurrency(value: number, currency = 'CAD'): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: currency || 'CAD',
  }).format(Number.isFinite(value) ? value : 0);
}

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
  // Legacy fallbacks
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

export function categoryColor(category?: string | null): string {
  return CATEGORY_CLASSES[category ?? ''] ?? FALLBACK_CLASS;
}

/* ─── AI Confidence Tone ─── */

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

export function shouldGlow(confidenceScore: number): boolean {
  return confidenceScore > 0 && confidenceScore < 80;
}

/* ─── Real-Time CRA Readiness Computation ─── */
/* Accepts partial form shapes to be compatible with both ReceiptForm and ReceiptFormValues */

export function computeLiveCRAScore(form: {
  vendor_name?: string;
  vendor_address?: string;
  business_number?: string;
  transaction_date?: string;
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  pst_amount: number;
  payment_method?: string;
  notes?: string;
  line_items?: unknown[];
}): number {
  let score = 0;

  if ((form.vendor_name ?? '').trim()) score += 15;
  if ((form.vendor_address ?? '').trim()) score += 8;
  if ((form.business_number ?? '').trim()) score += 18;
  if ((form.transaction_date ?? '').trim()) score += 12;
  if (form.total_amount > 0) score += 12;
  if (form.subtotal > 0) score += 8;
  if (form.tax_amount >= 0) score += 7;
  if (form.payment_method && form.payment_method !== 'Unknown') score += 5;
  if ((form.notes ?? '').split(/\s+/).filter(Boolean).length >= 8) score += 5;
  if ((form.line_items ?? []).length > 0) score += 6;

  const mathMismatch =
    Math.abs(form.subtotal + form.tax_amount + form.pst_amount - form.total_amount) > 0.02;
  if (mathMismatch && form.total_amount > 0) score -= 15;

  return Math.max(0, Math.min(100, Math.round(score)));
}
