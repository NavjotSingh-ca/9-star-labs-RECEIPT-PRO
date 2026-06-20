import type { Meta, StoryObj } from '@storybook/nextjs';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fn<T extends (...args: any[]) => any>(_impl?: T): T {
  return ((..._args: any[]) => undefined) as T;
}
import ScannerForm from './ScannerForm';
import { withProviders } from '../../../.storybook/utils';
import type { ReceiptForm, BusinessUnit } from './types';

const mockBusinessUnits: BusinessUnit[] = [
  { id: 'bu-1', name: 'Construction' },
  { id: 'bu-2', name: 'Transport' },
  { id: 'bu-3', name: 'Office Admin' },
];

const defaultFormData: ReceiptForm = {
  vendor_name: 'Staples Canada',
  vendor_address: '123 4th Ave SE, Calgary, AB T2G 0H5',
  business_number: '123456789RT0001',
  total_amount: 142.50,
  subtotal: 123.97,
  tax_amount: 18.53,
  pst_amount: 0,
  transaction_date: '2025-09-15',
  transaction_time: '14:30',
  payment_method: 'Visa',
  payment_reference: '',
  card_last_four: '4321',
  category: 'Office/Admin',
  notes: 'Office supplies for Q4',
  currency: 'CAD',
  confidence_score: 92,
  cra_readiness_score: 85,
  thermal_warning: false,
  document_type: 'receipt',
  duplicate_warning: false,
  duplicate_hash: '',
  math_mismatch_warning: false,
  missing_bn_warning: false,
  fraud_suspicion: false,
  fraud_reason: '',
  capture_source: 'camera',
  usage_type: 'business',
  business_use_percent: 100,
  job_code: 'JOB-1042',
  vehicle_id: '',
  business_unit_id: 'bu-1',
  paid_by: 'company_card',
  reimbursement_status: '',
  approval_status: 'submitted',
  exchange_rate: 1.0,
  line_items: [
    { description: 'Staples EasyTech USB Hub', quantity: 2, unit_price: 29.99, tax_rate: 5, tax_amount: 3.00, category: 'Office/Admin', line_total: 59.98 },
    { description: 'Avery File Folders (box)', quantity: 1, unit_price: 34.99, tax_rate: 5, tax_amount: 1.75, category: 'Office/Admin', line_total: 34.99 },
  ],
};

const meta: Meta<typeof ScannerForm> = {
  title: 'Scanner/ScannerForm',
  component: ScannerForm,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Large receipt review form with AI-extracted data, live CRA scoring, policy guardrails, math validation, and save flow.' } },
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    formData: defaultFormData,
    setFormData: fn(),
    businessUnits: mockBusinessUnits,
    saving: false,
    onSave: fn(),
    hasAnalyzed: true,
    vendorPrefillSource: null,
    onDismissPrefill: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof ScannerForm>;

export const Default: Story = {};

export const PrefilledFromHistory: Story = {
  args: { vendorPrefillSource: 'history' },
  parameters: { docs: { description: { story: 'Vendor pre-fill banner visible from history match.' } } },
};

export const Saving: Story = {
  args: { saving: true, hasAnalyzed: true },
};

export const NotAnalyzed: Story = {
  args: { hasAnalyzed: false },
  parameters: { docs: { description: { story: 'AI has not analyzed yet — save button is hidden.' } } },
};

export const WithNonCADCurrency: Story = {
  args: {
    formData: {
      ...defaultFormData,
      currency: 'USD',
      exchange_rate: 1.36,
      total_amount: 99.99,
    },
  },
  parameters: { docs: { description: { story: 'Non-CAD currency detected — shows FX rate card and exchange rate input.' } } },
};

export const WithErrors: Story = {
  args: {
    formData: {
      ...defaultFormData,
      fraud_suspicion: true,
      fraud_reason: 'AI detected that the vendor name "Staples Canada" does not match the credit card merchant "Amazon.ca". Manual review recommended.',
      thermal_warning: true,
    },
  },
  parameters: { docs: { description: { story: 'Fraud suspicion + thermal warning both visible.' } } },
};

export const EmptyForm: Story = {
  args: {
    formData: {
      vendor_name: '',
      vendor_address: '',
      business_number: '',
      total_amount: 0,
      subtotal: 0,
      tax_amount: 0,
      pst_amount: 0,
      transaction_date: new Date().toISOString().split('T')[0],
      transaction_time: '',
      payment_method: 'Unknown',
      payment_reference: '',
      card_last_four: '',
      category: 'Office/Admin',
      notes: '',
      currency: 'CAD',
      confidence_score: 0,
      cra_readiness_score: 0,
      thermal_warning: false,
      document_type: 'unknown',
      duplicate_warning: false,
      duplicate_hash: '',
      math_mismatch_warning: false,
      missing_bn_warning: false,
      fraud_suspicion: false,
      fraud_reason: '',
      capture_source: 'upload',
      usage_type: 'business',
      business_use_percent: 100,
      job_code: '',
      vehicle_id: '',
      business_unit_id: '',
      paid_by: 'company_card',
      reimbursement_status: '',
      approval_status: 'submitted',
      exchange_rate: 1.0,
      line_items: [],
    },
  },
};
