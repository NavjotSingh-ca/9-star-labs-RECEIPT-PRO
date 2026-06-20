import { describe, it, expect } from 'vitest';
import { receiptLineItemSchema, receiptFormSchema } from '@/lib/validations';

describe('receiptLineItemSchema', () => {
  it('validates a correct line item', () => {
    const item = {
      description: '2x4 Lumber',
      quantity: 10,
      unit_price: 3.50,
      tax_rate: 5,
      tax_amount: 1.75,
      line_total: 35.00,
    };
    const result = receiptLineItemSchema.safeParse(item);
    expect(result.success).toBe(true);
  });

  it('rejects empty description', () => {
    const item = {
      description: '',
      quantity: 1,
      unit_price: 10,
      tax_rate: 0,
      tax_amount: 0,
      line_total: 10,
    };
    const result = receiptLineItemSchema.safeParse(item);
    expect(result.success).toBe(false);
  });

  it('rejects negative quantity', () => {
    const item = {
      description: 'Nails',
      quantity: -1,
      unit_price: 10,
      tax_rate: 0,
      tax_amount: 0,
      line_total: 10,
    };
    const result = receiptLineItemSchema.safeParse(item);
    expect(result.success).toBe(false);
  });

  it('rejects negative unit price', () => {
    const item = {
      description: 'Hammer',
      quantity: 1,
      unit_price: -5,
      tax_rate: 0,
      tax_amount: 0,
      line_total: 10,
    };
    const result = receiptLineItemSchema.safeParse(item);
    expect(result.success).toBe(false);
  });
});

describe('receiptFormSchema', () => {
  it('validates a complete receipt form', () => {
    const form = {
      vendor_name: 'Home Depot',
      vendor_address: '123 Main St',
      business_number: '123456789RT001',
      transaction_date: '2026-06-13',
      transaction_time: '14:30',
      total_amount: 100.00,
      subtotal: 85.00,
      tax_amount: 15.00,
      pst_amount: 0,
      currency: 'CAD',
      payment_method: 'Visa',
      payment_reference: '',
      card_last_four: '1234',
      category: 'Job Materials',
      notes: 'Purchased lumber for framing',
      usage_type: 'business',
      business_use_percent: 100,
      business_unit_id: 'unit-1',
      capture_source: 'manual',
      document_type: 'receipt',
      fraud_reason: '',
      duplicate_hash: '',
      paid_by: 'self',
      line_items: [],
    };
    const result = receiptFormSchema.safeParse(form);
    expect(result.success).toBe(true);
  });

  it('rejects short vendor name', () => {
    const form = {
      vendor_name: 'A',
      transaction_date: '2026-06-13',
      total_amount: 10,
      subtotal: 10,
      tax_amount: 0,
      pst_amount: 0,
      currency: 'CAD',
      payment_method: 'Cash',
      category: 'General Expense',
      usage_type: null,
      business_use_percent: 100,
      business_unit_id: 'u1',
      capture_source: 'manual',
      document_type: 'receipt',
      fraud_reason: '',
      duplicate_hash: '',
      paid_by: 'self',
    };
    const result = receiptFormSchema.safeParse(form);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(i => i.path.includes('vendor_name'))).toBe(true);
    }
  });

  it('rejects negative total', () => {
    const form = {
      vendor_name: 'Store',
      transaction_date: '2026-06-13',
      total_amount: -10,
      subtotal: 0,
      tax_amount: 0,
      pst_amount: 0,
      currency: 'CAD',
      payment_method: 'Cash',
      category: 'General Expense',
      usage_type: null,
      business_use_percent: 100,
      business_unit_id: 'u1',
      capture_source: 'manual',
      document_type: 'receipt',
      fraud_reason: '',
      duplicate_hash: '',
      paid_by: 'self',
    };
    const result = receiptFormSchema.safeParse(form);
    expect(result.success).toBe(false);
  });

  it('rejects invalid currency length', () => {
    const form = {
      vendor_name: 'Store',
      transaction_date: '2026-06-13',
      total_amount: 10,
      subtotal: 10,
      tax_amount: 0,
      pst_amount: 0,
      currency: 'US',
      payment_method: 'Cash',
      category: 'General Expense',
      usage_type: null,
      business_use_percent: 100,
      business_unit_id: 'u1',
      capture_source: 'manual',
      document_type: 'receipt',
      fraud_reason: '',
      duplicate_hash: '',
      paid_by: 'self',
    };
    const result = receiptFormSchema.safeParse(form);
    expect(result.success).toBe(false);
  });
});
