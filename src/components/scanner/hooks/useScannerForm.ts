'use client';

import { useCallback, useMemo } from 'react';
import { useForm, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createBlankReceiptForm } from '../types';
import type { ReceiptForm, BusinessUnit } from '../types';

// Zod schema for receipt form validation - matches ReceiptForm type EXACTLY
const receiptFormSchema = z.object({
  // Core receipt fields
  vendor_name: z.string().min(1, 'Vendor name is required').max(200),
  vendor_address: z.string().max(500),
  business_number: z.string().max(50),

  total_amount: z.number().min(0, 'Amount must be positive'),
  subtotal: z.number().min(0),
  tax_amount: z.number().min(0),
  pst_amount: z.number().min(0),

  transaction_date: z.string().min(1, 'Date is required'),
  transaction_time: z.string(),

  payment_method: z.string(),
  payment_reference: z.string(),
  card_last_four: z.string(),

  category: z.string(),
  notes: z.string().max(5000),
  currency: z.string(),

  confidence_score: z.number(),
  cra_readiness_score: z.number(),

  thermal_warning: z.boolean(),
  document_type: z.enum(['receipt', 'invoice', 'statement', 'estimate', 'unknown'] as const),
  duplicate_warning: z.boolean(),
  duplicate_hash: z.string(),
  math_mismatch_warning: z.boolean(),
  missing_bn_warning: z.boolean(),
  needs_reimbursement: z.boolean().optional(),
  fraud_suspicion: z.boolean(),
  fraud_reason: z.string(),
  capture_source: z.enum(['camera', 'upload', 'email', 'email_screenshot', 'bulk-import', 'accountant-import'] as const),
  usage_type: z.enum(['business', 'personal', 'mixed'] as const),
  business_use_percent: z.number().min(0).max(100),
  job_code: z.string().max(50),
  vehicle_id: z.string(),
  business_unit_id: z.string(),

  /* ─── Payment Context (Suite II) ─── */
  paid_by: z.enum(['company_card', 'employee_cash', '']),
  reimbursement_status: z.enum(['pending', 'approved', 'rejected', '']),
  approval_status: z.enum(['submitted', 'approved', 'rejected', '']),

  /* ─── Multi-Currency ─── */
  exchange_rate: z.number().positive(),

  line_items: z.array(z.object({
    description: z.string(),
    quantity: z.number().min(0),
    unit_price: z.number().min(0),
    tax_rate: z.number().min(0),
    tax_amount: z.number().min(0),
    category: z.string(),
    line_total: z.number().min(0),
  })),
});

interface UseReceiptFormOptions {
  initialData?: Partial<ReceiptForm>;
  businessUnits: BusinessUnit[];
  onVendorChange?: (vendorName: string) => void;
}

export function useReceiptForm({
  businessUnits,
  onVendorChange,
}: UseReceiptFormOptions) {
  const defaultValues = useMemo(
    () => createBlankReceiptForm(),
    []
  );

  // Form typed as ReceiptForm. The Zod schema is stricter than the type
  // (all required vs some nullable), so we use the type parameter directly.
  const form = useForm<ReceiptForm>({
    resolver: zodResolver(receiptFormSchema) as Resolver<ReceiptForm>,
    defaultValues,
    mode: 'onChange',
  });

  const formData = form.watch();

  const watchedVendor = form.watch('vendor_name');
  const watchedAmount = form.watch('total_amount');
  const watchedDate = form.watch('transaction_date');
  const watchedCategory = form.watch('category');
  const watchedBusinessNumber = form.watch('business_number');
  const watchedCurrency = form.watch('currency');
  const watchedExchangeRate = form.watch('exchange_rate');
  const watchedBusinessUnitId = form.watch('business_unit_id');
  const watchedUsageType = form.watch('usage_type');
  const watchedPaymentMethod = form.watch('payment_method');

  // Vendor autocomplete logic
  const handleVendorChange = useCallback(
    (vendorName: string) => {
      form.setValue('vendor_name', vendorName);
      onVendorChange?.(vendorName);
    },
    [form, onVendorChange]
  );

  // Auto-set category based on vendor
  const handleVendorBlur = useCallback(() => {
    // Could implement vendor -> category mapping here
  }, []);

  // Auto-calculate tax from subtotal
  const handleSubtotalChange = useCallback(
    (subtotal: number) => {
      const total = form.getValues('total_amount');
      if (total && subtotal) {
        const tax = Math.max(0, total - subtotal);
        form.setValue('tax_amount', Math.round(tax * 100) / 100);
      }
    },
    [form]
  );

  // Handle currency change
  const handleCurrencyChange = useCallback(
    (currency: string) => {
      form.setValue('currency', currency);
      if (currency !== 'CAD') {
        form.setValue('exchange_rate', 1);
      }
    },
    [form]
  );

  // Handle exchange rate change
  const handleExchangeRateChange = useCallback(
    (rate: number) => {
      if (rate > 0) {
        form.setValue('exchange_rate', rate);
        // Removed CAD equivalent calculation as it's not in ReceiptForm type
      }
    },
    [form]
  );

  // Business unit change handler
  const handleBusinessUnitChange = useCallback(
    (unitId: string) => {
      form.setValue('business_unit_id', unitId);
    },
    [form]
  );

  // Project change handler - project_id not in ReceiptForm
  const handleProjectChange = useCallback(
    (_projectId: string) => {
      // project_id not in ReceiptForm type
    },
    []
  );

  // Payment method change
  const handlePaymentMethodChange = useCallback(
    (method: string) => {
      form.setValue('payment_method', method);
      if (method === 'employee_cash') {
        form.setValue('reimbursement_status', 'pending');
      } else {
        form.setValue('reimbursement_status', '');
      }
    },
    [form]
  );

  // Validation helpers
  const validateField = useCallback(
    async (_name: keyof ReceiptForm, _value: unknown) => {
      // Could implement field-level validation here
    },
    []
  );

  const setFieldError = useCallback(
    (name: keyof ReceiptForm, message: string) => {
      form.setError(name, { type: 'manual', message });
    },
    [form]
  );

  const clearFieldError = useCallback(
    (name: keyof ReceiptForm) => {
      form.clearErrors(name);
    },
    [form]
  );

  // Reset form to initial state
  const resetForm = useCallback(
    () => {
      form.reset(createBlankReceiptForm());
    },
    [form]
  );

  // Get form state for persistence
  const getFormState = useCallback(() => {
    return {
      values: form.getValues(),
      errors: form.formState.errors,
      isDirty: form.formState.isDirty,
      isValid: form.formState.isValid,
    };
  }, [form]);

  const restoreFormState = useCallback(
    (state: ReturnType<typeof getFormState>) => {
      Object.entries(state.values).forEach(([key, value]) => {
        form.setValue(key as keyof ReceiptForm, value);
      });
    },
    [form]
  );

  return {
    // Form methods
    form,
    register: form.register,
    handleSubmit: form.handleSubmit,
    setValue: form.setValue,
    getValues: form.getValues,
    watch: form.watch,
    setError: form.setError,
    clearErrors: form.clearErrors,
    trigger: form.trigger,
    reset: form.reset,
    formState: form.formState,

    // Form data
    formData,
    watchedVendor,
    watchedAmount,
    watchedDate,
    watchedCategory,
    watchedBusinessNumber,
    watchedCurrency,
    watchedExchangeRate,
    watchedBusinessUnitId,
    watchedUsageType,
    watchedPaymentMethod,

    // Handlers
    handleVendorChange,
    handleVendorBlur,
    handleSubtotalChange,
    handleCurrencyChange,
    handleExchangeRateChange,
    handleBusinessUnitChange,
    handleProjectChange,
    handlePaymentMethodChange,
    validateField,
    setFieldError,
    clearFieldError,

    // Form management
    resetForm,
    getFormState,
    restoreFormState,

    // Business units for selects
    businessUnits,
  };
}