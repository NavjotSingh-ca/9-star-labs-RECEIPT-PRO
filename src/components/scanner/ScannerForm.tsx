'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, CheckCircle2, DollarSign, FileText, Hash, Plus, Trash2, Info, Loader2, Gauge, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

import type { ReceiptForm, ReceiptLineItem, ScannerFormProps } from './types';
import { CATEGORIES, PAYMENT_METHODS, USAGE_TYPES } from './types';
import { shouldGlow, computeLiveCRAScore } from '@/lib/ui-utils';
import { receiptFormSchema, ReceiptFormValues } from '@/lib/validations';
import { isMathMismatch } from '@/lib/finance-utils';
import { dinero, add, equal, CAD } from 'dinero.js';
import { usePlan } from '@/hooks/use-plan';

const baseInputCls =
  'w-full px-3 py-2.5 text-sm text-text-primary outline-none transition placeholder:text-text-muted border';

const inputCls =
  `${baseInputCls} rounded-lg border-glass-border bg-surface-raised focus:border-champagne/40 focus:ring-2 focus:ring-champagne/15`;

const errorInputCls =
  `${baseInputCls} rounded-lg border-danger/40 bg-danger/[0.06] focus:border-danger/60 focus:ring-2 focus:ring-danger/15`;

const warningInputCls =
  `${baseInputCls} rounded-lg border-warning/40 bg-warning/[0.06] focus:border-warning/60 focus:ring-2 focus:ring-warning/15`;

function safeNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}



function craScoreBgClass(score: number): string {
  if (score >= 80) return 'bg-emerald-success';
  if (score >= 60) return 'bg-warning';
  return 'bg-danger';
}

/* ─── Receipt Quota Counter ─── */
function QuotaBar() {
  const { receiptCount, isLoading, gates } = usePlan();
  const limit = gates.receiptLimit;

  if (isLoading || limit === Infinity) return null;

  const pct = Math.min((receiptCount / limit) * 100, 100);
  const remaining = Math.max(limit - receiptCount, 0);
  
  const barColor = pct >= 100 ? 'bg-danger' : pct >= 80 ? 'bg-warning' : 'bg-emerald-success';
  const textColor = pct >= 100 ? 'text-danger' : pct >= 80 ? 'text-warning' : 'text-emerald-light';
  
  return (
    <div className="mx-4 mt-3 rounded-lg border border-glass-border bg-surface-raised p-3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Gauge className={`h-3.5 w-3.5 ${textColor}`} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Monthly Quota</span>
        </div>
        <span className={`text-xs font-bold tabular-nums ${textColor}`}>
          {receiptCount} / {limit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-glass-border overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      {pct >= 100 ? (
        <p className="mt-1.5 text-[10px] text-danger font-semibold">
          Limit reached — upgrade to Pro for unlimited scans.
        </p>
      ) : pct >= 80 ? (
        <p className="mt-1.5 text-[10px] text-warning font-medium">
          {remaining} receipt{remaining === 1 ? '' : 's'} remaining this month.
        </p>
      ) : null}
    </div>
  );
}

export default function ScannerForm({
  formData: rawFormData,
  setFormData,
  businessUnits,
  saving,
  onSave,
  hasAnalyzed,
  vendorPrefillSource,
  onDismissPrefill,
}: ScannerFormProps & { hasAnalyzed?: boolean }) {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [fraudDismissed, setFraudDismissed] = useState(false);
  const fraudSeenRef = useRef(false);

  // Initialize RHF
  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptFormSchema),
    defaultValues: rawFormData,
    mode: 'onBlur',
  });
  
  const { fields: lineItems, append, remove } = useFieldArray({
    control,
    name: "line_items"
  });

  // Watch entire form for live metrics
  const formData = watch();

  // Sync upstream incoming formData shifts — reset entire form when AI data arrives
  useEffect(() => {
    reset(rawFormData);
    setIsConfirmed(false);
    fraudSeenRef.current = false;
    setFraudDismissed(false);
  }, [rawFormData, reset]);

  const missingBN = Boolean(errors.business_number) || !String(formData.business_number ?? '').trim();
  
  // Custom Math Mismatch Check avoiding blocker
  const mathMismatch = isMathMismatch(
    safeNumber(formData.subtotal),
    safeNumber(formData.tax_amount),
    safeNumber(formData.pst_amount),
    safeNumber(formData.total_amount)
  );

  const thermalWarning = Boolean(formData.thermal_warning);
  const fraudSuspicion = Boolean(formData.fraud_suspicion);
  const fraudReason = formData.fraud_reason || 'AI detected a potential anomaly or policy violation in this receipt.';

  /* ─── Real-Time CRA Score ─── */
  const liveCRAScore = useMemo(() => computeLiveCRAScore({
    vendor_name: formData.vendor_name ?? '',
    vendor_address: formData.vendor_address ?? '',
    business_number: formData.business_number ?? '',
    transaction_date: formData.transaction_date ?? '',
    total_amount: safeNumber(formData.total_amount),
    subtotal: safeNumber(formData.subtotal),
    tax_amount: safeNumber(formData.tax_amount),
    pst_amount: safeNumber(formData.pst_amount),
    payment_method: formData.payment_method ?? '',
    notes: formData.notes ?? '',
    line_items: lineItems as ReceiptLineItem[],
  }), [formData, lineItems]);

  const lowReadiness = liveCRAScore < 70;
  const glowActive = shouldGlow(safeNumber(formData.confidence_score));
  const isNonCAD = formData.currency && formData.currency !== 'CAD';

  /* ─── Explainable Policy Engine Flags ─── */
  const isHighValue = safeNumber(formData.total_amount) > 500;
  const needsVehicleId = formData.category?.toLowerCase().includes('fuel') && !formData.vehicle_id?.trim();
  const isOutOfProvince = Boolean(formData.vendor_address) && !/Alberta|AB\b/i.test(formData.vendor_address ?? '');

  const performSave = (data: ReceiptFormValues) => {
    const finalData = { ...data, high_audit_risk: mathMismatch } as unknown as ReceiptForm;
    setFormData(finalData);
    onSave(finalData);
  };

  const isMathValid = useMemo(() => {
    try {
      const dSub = dinero({ amount: Math.round(safeNumber(formData.subtotal) * 100), currency: CAD });
      const dTax = dinero({ amount: Math.round(safeNumber(formData.tax_amount) * 100), currency: CAD });
      const dPst = dinero({ amount: Math.round(safeNumber(formData.pst_amount) * 100), currency: CAD });
      const dTotal = dinero({ amount: Math.round(safeNumber(formData.total_amount) * 100), currency: CAD });

      const sum = add(dSub, add(dTax, dPst));
      return equal(sum, dTotal);
    } catch {
      return false;
    }
  }, [formData.subtotal, formData.tax_amount, formData.pst_amount, formData.total_amount]);

  const canSave = hasAnalyzed && isConfirmed && !saving;

  // Auto-dismiss fraud anomaly when user edits relevant fields
  useEffect(() => {
    if (fraudSuspicion && hasAnalyzed) {
      fraudSeenRef.current = true;
    }
    if (fraudSeenRef.current && fraudSuspicion) {
      const hasUserEdit =
        String(formData.vendor_name ?? '') !== String(rawFormData.vendor_name ?? '') ||
        Number(formData.total_amount) !== Number(rawFormData.total_amount) ||
        String(formData.transaction_date ?? '') !== String(rawFormData.transaction_date ?? '') ||
        String(formData.vendor_address ?? '') !== String(rawFormData.vendor_address ?? '') ||
        String(formData.business_number ?? '') !== String(rawFormData.business_number ?? '');
      if (hasUserEdit) {
        setFraudDismissed(true);
        setValue('fraud_suspicion', false);
        setValue('fraud_reason', '');
      }
    }
  }, [formData.vendor_name, formData.total_amount, formData.transaction_date, formData.vendor_address, formData.business_number, rawFormData.vendor_name, rawFormData.total_amount, rawFormData.transaction_date, rawFormData.vendor_address, rawFormData.business_number, fraudSuspicion, hasAnalyzed, setValue]);

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit(performSave)}>
        {/* Header */}
        <div className="p-4 border-b border-glass-border bg-surface-raised">
          <h3 className="text-lg font-bold text-text-primary">Review Data</h3>
          <p className="text-sm text-text-secondary">Verify extracted details.</p>
        </div>

        {/* Receipt Quota Counter */}
        <QuotaBar />

        {/* Form fields */}
        <div className="p-4 space-y-6 bg-surface">

      {/* Vendor Pre-Fill Banner */}
      {vendorPrefillSource === 'history' && (
        <div className="rounded-lg border border-champagne/20 bg-champagne/[0.04] p-3.5 flex items-start gap-3">
          <Sparkles className="h-4 w-4 text-champagne shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-champagne">Pre-filled from your history</p>
            <p className="text-xs text-text-secondary mt-0.5">Category, job code, and business use % were set from your previous receipts for this vendor. Please confirm or adjust.</p>
          </div>
          <button type="button" onClick={onDismissPrefill} className="text-text-muted hover:text-text-primary text-xs font-medium shrink-0 mt-0.5">Dismiss</button>
        </div>
      )}

      {/* FX Rate Display (non-CAD receipts) */}
      {isNonCAD && (
        <div className="rounded-lg border border-champagne/15 bg-champagne/5 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-champagne mb-1">Auto Exchange Rate</p>
          <p className="text-xs text-text-secondary">1 <span className="font-bold text-text-primary">{formData.currency}</span> ≈ <span className="font-bold text-emerald-light">${(formData.exchange_rate || 1).toFixed(4)}</span> CAD — fetched from Bank of Canada on save.</p>
          <p className="text-[10px] text-text-muted mt-1">Final authoritative rate applied server-side for CRA compliance.</p>
        </div>
      )}

      {/* Warnings & Live Policy Guardrails */}
      <div className="space-y-3">
        {formData.document_type?.toLowerCase() === 'estimate' && (
          <div className="rounded-lg border border-champagne/20 bg-champagne/10 px-3.5 py-2.5">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-champagne" />
              <div>
                <p className="text-sm font-bold text-champagne-dim">Notice: This is an Estimate</p>
                <p className="mt-1 text-xs leading-relaxed text-champagne/80">This is not a tax-deductible receipt yet. Ensure you receive a final invoice or receipt upon payment.</p>
              </div>
            </div>
          </div>
        )}
        
        {(missingBN || mathMismatch || thermalWarning || lowReadiness || fraudSuspicion || isHighValue || needsVehicleId || isOutOfProvince) && (
          <>
          {/* Policy Flags */}
          {isHighValue && (
            <div className="rounded-lg border border-[#dfcaaa]/40 bg-[#dfcaaa]/10 px-3.5 py-2.5">
              <div className="flex items-start gap-3">
                <DollarSign className="mt-0.5 h-4 w-4 flex-shrink-0 text-champagne" />
                <div>
                  <p className="text-sm font-bold text-champagne">Audit Flag: High-Value Expense requires Owner Approval</p>
                  <p className="mt-1 text-xs leading-relaxed text-champagne/80">Expenses over $500 will enter the Owner Queue before reimbursement.</p>
                </div>
              </div>
            </div>
          )}
          {needsVehicleId && (
            <div className="rounded-lg border border-warning/20 bg-warning/[0.06] px-3.5 py-2.5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" />
                <div>
                  <p className="text-sm font-bold text-warning">CRA Tip: Vehicle ID is mandatory for fuel ITC.</p>
                  <p className="mt-1 text-xs leading-relaxed text-warning/80">Input the physical truck or asset ID to claim input tax credits safely.</p>
                </div>
              </div>
            </div>
          )}
          {isOutOfProvince && (
            <div className="rounded-lg border border-champagne/20 bg-champagne/10 px-3.5 py-2.5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-champagne" />
                <div>
                  <p className="text-sm font-bold text-champagne-dim">Out-of-Province Expense Detected</p>
                  <p className="mt-1 text-xs leading-relaxed text-champagne/80">Ensure proper PST/HST rates are applied for non-Alberta transactions.</p>
                </div>
              </div>
            </div>
          )}

          {/* Core AI Flags */}
          {fraudSuspicion && !fraudDismissed && (
            <div className="rounded-lg border border-danger/40 bg-danger/[0.06] px-4 py-3 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-danger/20 text-danger mt-0.5 text-[10px] font-bold">!</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="rounded bg-danger/15 px-1.5 py-0.5 text-[10px] font-mono font-bold text-danger/80 tracking-wide">ANOMALY-001</span>
                    <span className="text-[11px] font-semibold text-danger">AI Flagged</span>
                  </div>
                  <p className="text-xs leading-relaxed text-danger/90 font-mono">
                    {fraudReason}
                  </p>
                </div>
              </div>
            </div>
          )}
          {fraudDismissed && (
            <div className="rounded-lg border border-champagne/20 bg-champagne/[0.04] px-3.5 py-2.5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-champagne" />
                <div>
                  <p className="text-sm font-semibold text-champagne">Anomaly dismissed — review your changes manually</p>
                  <p className="mt-0.5 text-xs text-text-muted">The flagged fields were edited. Verify the corrected values before saving.</p>
                </div>
              </div>
            </div>
          )}
          {missingBN && (
            <div className="rounded-lg border border-warning/20 bg-warning/[0.06] px-3.5 py-2.5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" />
                <div>
                  <p className="text-sm font-bold text-warning">Missing GST / Business Number</p>
                  <p className="mt-1 text-xs leading-relaxed text-warning/80">
                    CRA claims are harder to support when the supplier GST/BN is missing.
                  </p>
                </div>
              </div>
            </div>
          )}
          {mathMismatch && (
            <div className="rounded-lg border border-warning/20 bg-warning/[0.06] px-3.5 py-2.5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" />
                <div>
                  <p className="text-sm font-bold text-warning">Caution: Totals do not match. Proceed with override?</p>
                  <p className="mt-1 text-xs leading-relaxed text-warning/80">
                    The subtotal plus taxes does not match the total within expected tolerance. A high audit risk flag will be attached.
                  </p>
                </div>
              </div>
            </div>
          )}
          {thermalWarning && (
            <div className="rounded-lg border border-warning/20 bg-warning/[0.06] px-3.5 py-2.5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" />
                <div>
                  <p className="text-sm font-bold text-warning">Thermal receipt warning</p>
                  <p className="mt-1 text-xs leading-relaxed text-warning/80">
                    This appears to be a thermal receipt. Back it up promptly.
                  </p>
                </div>
              </div>
            </div>
          )}
          {lowReadiness && (
            <div className="rounded-lg border border-warning/20 bg-warning/[0.06] px-3.5 py-2.5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" />
                <div>
                  <p className="text-sm font-bold text-warning">Low CRA readiness</p>
                  <p className="mt-1 text-xs leading-relaxed text-warning/80">
                    The extracted record may be incomplete. Double check vendor, taxes, and dates.
                  </p>
                </div>
              </div>
            </div>
          )}
          </>
        )}
      </div>

      {/* Card 1: Store Info */}
      <div className="rounded-xl border border-glass-border bg-surface shadow-sm">
        <div className="border-b border-glass-border px-5 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted">1. Store Info</p>
        </div>
        <div className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">Vendor Name</label>
              <input type="text" {...register('vendor_name')} className={`${errors.vendor_name ? errorInputCls : (glowActive ? inputCls + ' self-healing-glow' : inputCls)}`} placeholder="Supplier name" />
              {errors.vendor_name && <p className="mt-1 text-xs text-danger">{errors.vendor_name.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">Vendor Address</label>
              <input type="text" {...register('vendor_address')} className={inputCls} placeholder="123 Main St, Calgary, AB" />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Date
                <span className="group relative flex items-center">
                  <Info className="h-3 w-3 text-champagne cursor-help" />
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden w-max max-w-[200px] rounded-md bg-surface-raised px-2 py-1 text-[10px] text-text-primary shadow-xl group-hover:block border border-glass-border">
                    CRA Required: Needed for ITCs.
                  </span>
                </span>
              </label>
              <input type="date" {...register('transaction_date')} className={errors.transaction_date ? errorInputCls : inputCls} />
              {errors.transaction_date && <p className="mt-1 text-xs text-danger">{errors.transaction_date.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">Time</label>
              <input type="time" {...register('transaction_time')} className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">Payment Method</label>
              <select {...register('payment_method')} className={inputCls}>
                {PAYMENT_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">Card end digits</label>
              <input type="text" maxLength={4} {...register('card_last_four')} className={errors.card_last_four ? errorInputCls : inputCls} placeholder="1234" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">Payment Ref</label>
              <input type="text" {...register('payment_reference')} className={inputCls} placeholder="Approval Code" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">Currency</label>
              <input type="text" {...register('currency')} className={errors.currency ? errorInputCls : inputCls} placeholder="CAD" />
            </div>
          </div>
        </div>
      </div>

      {/* Card 1.5: Who Paid? (Payment Context) */}
      <div className="rounded-xl border border-glass-border bg-surface shadow-sm">
        <div className="border-b border-glass-border px-5 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted">Payment Context</p>
        </div>
        <div className="p-5">
          <p className="mb-3 text-sm font-semibold text-text-primary">Who paid for this?</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setValue('paid_by', 'company_card');
                setValue('reimbursement_status', null);
              }}
              className={`rounded-lg border p-3.5 text-left transition ${
                formData.paid_by === 'company_card'
                  ? 'border-champagne/40 bg-champagne/[0.08]'
                  : 'border-glass-border bg-surface-raised hover:border-glass-border-hover'
              }`}
            >
              <div className="flex items-center gap-2">
                <DollarSign className={`h-4 w-4 ${formData.paid_by === 'company_card' ? 'text-champagne' : 'text-text-muted'}`} />
                <span className={`text-sm font-semibold ${formData.paid_by === 'company_card' ? 'text-champagne' : 'text-text-secondary'}`}>
                  Company Card
                </span>
              </div>
              <p className="mt-1 text-xs text-text-muted">No reimbursement needed</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setValue('paid_by', 'employee_cash');
                setValue('reimbursement_status', 'pending');
              }}
              className={`rounded-lg border p-3.5 text-left transition ${
                formData.paid_by === 'employee_cash'
                  ? 'border-warning/40 bg-warning/[0.08]'
                  : 'border-glass-border bg-surface-raised hover:border-glass-border-hover'
              }`}
            >
              <div className="flex items-center gap-2">
                <DollarSign className={`h-4 w-4 ${formData.paid_by === 'employee_cash' ? 'text-warning' : 'text-text-muted'}`} />
                <span className={`text-sm font-semibold ${formData.paid_by === 'employee_cash' ? 'text-warning' : 'text-text-secondary'}`}>
                  Employee Cash
                </span>
              </div>
              <p className="mt-1 text-xs text-text-muted">Reimbursement needed</p>
            </button>
          </div>

          {formData.paid_by === 'employee_cash' && (
            <div className="mt-3 rounded-lg border border-warning/20 bg-warning/[0.06] px-3.5 py-2.5">
              <div className="flex items-center gap-2 text-sm text-warning">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span className="font-semibold">Reimbursement queued</span>
              </div>
              <p className="mt-1 text-xs text-warning/80">This receipt will appear in the Owner reimbursement queue for approval.</p>
            </div>
          )}
        </div>
      </div>

      {/* Card 2: Financials */}
      <div className="rounded-xl border border-glass-border bg-surface shadow-sm">
        <div className="border-b border-glass-border px-5 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted">2. Financials</p>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">Subtotal</label>
              <input type="number" step="0.01" min="0" {...register('subtotal', { valueAsNumber: true })} className={errors.subtotal ? errorInputCls : inputCls} />
              {errors.subtotal && <p className="mt-1 text-xs text-danger">{errors.subtotal.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Total
                <span className="group relative flex items-center">
                  <Info className="h-3 w-3 text-champagne cursor-help" />
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden w-max max-w-[200px] rounded-md bg-surface-raised px-2 py-1 text-[10px] text-text-primary shadow-xl group-hover:block border border-glass-border">
                    CRA Required: Needed for ITCs.
                  </span>
                </span>
              </label>
              <input type="number" step="0.01" min="0" {...register('total_amount', { valueAsNumber: true })} className={errors.total_amount ? errorInputCls : (glowActive ? inputCls + ' self-healing-glow' : inputCls)} />
              {errors.total_amount && <p className="mt-1 text-xs text-danger">{errors.total_amount.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">GST Amount</label>
              <input type="number" step="0.01" min="0" {...register('tax_amount', { valueAsNumber: true })} className={errors.tax_amount ? errorInputCls : inputCls} />
              {errors.tax_amount && <p className="mt-1 text-xs text-danger">{errors.tax_amount.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">PST / HST</label>
              <input type="number" step="0.01" min="0" {...register('pst_amount', { valueAsNumber: true })} className={errors.pst_amount ? errorInputCls : inputCls} />
              {errors.pst_amount && <p className="mt-1 text-xs text-danger">{errors.pst_amount.message}</p>}
            </div>
          </div>

          {/* Multi-Currency Exchange Rate */}
          {isNonCAD && (
            <div className="mt-4 rounded-lg border border-champagne/20 bg-champagne/10 p-3.5">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-champagne">Non-CAD Currency Detected: {formData.currency}</p>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">Exchange Rate to CAD</label>
                <input type="number" step="0.0001" min="0" {...register('exchange_rate', { valueAsNumber: true })} className={inputCls} placeholder="1.0000" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card 3: Compliance */}
      <div className="rounded-xl border border-glass-border bg-surface shadow-sm">
        <div className="border-b border-glass-border px-5 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted">3. Compliance</p>
        </div>
        <div className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                GST / Vendor Tax Number
                <span className="group relative flex items-center">
                  <Info className="h-3 w-3 text-champagne cursor-help" />
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden w-max max-w-[200px] rounded-md bg-surface-raised px-2 py-1 text-[10px] text-text-primary shadow-xl group-hover:block border border-glass-border z-10">
                    CRA Required: Needed for ITCs.
                  </span>
                </span>
              </label>
              <input type="text" {...register('business_number')} className={errors.business_number ? errorInputCls : (missingBN ? warningInputCls : inputCls)} placeholder="123456789RT0001" />
              {errors.business_number && <p className="mt-1 text-xs text-danger">{errors.business_number.message}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">Category</label>
              <select {...register('category')} className={inputCls}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">Usage Type</label>
              <select {...register('usage_type')} className={inputCls}>
                {USAGE_TYPES.map((u) => <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">Job code</label>
              <input type="text" {...register('job_code')} className={inputCls} placeholder="JOB-1042" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">Vehicle ID</label>
              <input type="text" {...register('vehicle_id')} className={needsVehicleId ? warningInputCls : inputCls} placeholder="Truck 12" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">Business unit</label>
              <select {...register('business_unit_id')} className={inputCls}>
                <option value="">Unassigned</option>
                {businessUnits.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">Business purpose / memo</label>
              <textarea rows={3} {...register('notes')} className={`${inputCls} resize-none`} placeholder="Describe the business purpose..." />
            </div>
          </div>
        </div>
      </div>

      {/* High-Density Line Items (Stacked Row Format) */}
      <div className="overflow-hidden rounded-xl border border-glass-border bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-glass-border px-5 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted">Line Items</p>
          <button type="button" onClick={() => append({ description: '', quantity: 1, unit_price: 0, tax_rate: 0, tax_amount: 0, line_total: 0 })} className="inline-flex items-center gap-1.5 rounded-lg bg-surface-raised px-2.5 py-1.5 text-xs font-semibold text-text-secondary transition hover:bg-glass-border-hover hover:text-text-primary">
            <Plus className="h-3 w-3" aria-hidden="true" /> Add Item
          </button>
        </div>
        <div className="divide-y divide-glass-border shrink-0">
          {lineItems.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-text-muted">No line items available.</div>
          ) : (
            lineItems.map((item, index) => (
              <div key={item.id} className="flex gap-4 px-5 py-4 transition hover:bg-surface-hover/50">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <input type="text" {...register(`line_items.${index}.description` as const)} className="w-full min-w-0 bg-transparent text-sm font-semibold text-text-primary placeholder:text-text-muted focus:outline-2 focus:outline-champagne/40 focus:outline-offset-2 rounded-sm" placeholder="Item description" />
                    <div className="min-w-[70px] shrink-0 font-mono text-sm font-bold text-champagne text-right">${safeNumber(formData.line_items?.[index]?.line_total).toFixed(2)}</div>
                  </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-text-muted">
                      <div className="flex items-center gap-1.5">
                        <span>Qty:</span>
                        <input type="number" min="0" step="1" {...register(`line_items.${index}.quantity` as const, { valueAsNumber: true, onChange: (e) => { const q = Number(e.target.value) || 0; const u = safeNumber(formData.line_items?.[index]?.unit_price); setValue(`line_items.${index}.line_total` as const, Math.round(q * u * 100) / 100); } })} className="w-12 rounded border border-transparent bg-surface-raised px-1 py-0.5 text-text-secondary focus:border-glass-border focus:outline-none" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>Unit:</span>
                        <input type="number" min="0" step="0.01" {...register(`line_items.${index}.unit_price` as const, { valueAsNumber: true, onChange: (e) => { const u = Number(e.target.value) || 0; const q = safeNumber(formData.line_items?.[index]?.quantity); setValue(`line_items.${index}.line_total` as const, Math.round(q * u * 100) / 100); } })} className="w-16 rounded border border-transparent bg-surface-raised px-1 py-0.5 text-text-secondary focus:border-glass-border focus:outline-none" />
                      </div>
                    </div>
                </div>
                <button type="button" onClick={() => remove(index)} className="shrink-0 self-start text-text-muted transition hover:text-danger p-1">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Real-Time Scores */}
      <section className="grid grid-cols-2 gap-4" aria-live="polite">
        <div className="rounded-xl border border-glass-border bg-surface-raised px-4 py-3.5">
          <div className="flex items-center gap-2 text-text-muted">
            <Hash className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">AI confidence</span>
          </div>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-text-primary">{safeNumber(formData.confidence_score)}</p>
        </div>
        <div className="rounded-xl border border-glass-border bg-surface-raised px-4 py-3.5">
          <div className="flex items-center gap-2 text-text-muted">
            <FileText className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">CRA readiness</span>
          </div>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-champagne">{liveCRAScore}</p>
          <div className="mt-2 h-1 rounded-full bg-obsidian overflow-hidden">
            <div
              className={`h-full rounded-full ${craScoreBgClass(liveCRAScore)}`}
              style={{ width: `${liveCRAScore}%` }}
            />
          </div>
        </div>
      </section>
    </div>

        {/* Buttons */}
        <div className="sticky bottom-0 bg-surface border-t border-glass-border p-4 space-y-3 z-20">
          {!isMathValid && hasAnalyzed && (
            <div className="flex items-center gap-2 rounded-lg bg-danger/10 px-3 py-2 text-xs font-semibold text-danger border border-danger/20">
              <AlertTriangle className="h-4 w-4" />
              Math Discrepancy
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button 
              type="button" 
              onClick={() => setIsConfirmed((v) => !v)} 
              className={`flex items-center gap-3 rounded-lg border p-3.5 text-left transition ${
                isConfirmed
                  ? 'border-emerald-light/40 bg-emerald-success/20'
                  : 'border-glass-border bg-surface-raised hover:bg-surface-hover'
              }`}
            >
              <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all ${
                isConfirmed
                  ? 'border-emerald-light bg-emerald-light text-obsidian'
                  : 'border-glass-border bg-surface'
              }`}>
                {isConfirmed && <CheckCircle2 className="h-3.5 w-3.5 text-obsidian" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">I confirm the data above is accurate</p>
              </div>
            </button>

            {hasAnalyzed && (
              <button
                type="submit"
                disabled={!canSave}
                title={
                  !hasAnalyzed ? 'Wait for AI processing to complete' :
                  !isConfirmed ? 'Confirm accuracy before saving' :
                  saving ? 'Saving...' :
                  'Save this receipt'
                }
                className="w-full h-12 bg-champagne hover:bg-champagne-dim disabled:opacity-40 text-obsidian font-semibold rounded-lg flex items-center justify-center gap-2 transition shadow-sm"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                <span>{saving ? 'Saving...' : 'Save Receipt'}</span>
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}