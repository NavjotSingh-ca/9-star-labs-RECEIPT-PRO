import type { Meta, StoryObj } from '@storybook/nextjs';
import AnomalyDashboard from './AnomalyDashboard';
import { withProviders, withQueryData } from '../../.storybook/utils';
import type { ReceiptRow } from '@/lib/types';

const mockAnomalies = {
  fraudReceipts: [
    {
      id: 'fraud-1', vendor_name: 'Unknown Vendor', total_amount: 12500,
      fraud_reason: 'Unusual pattern: multiple receipts from same IP within 1 minute',
      created_at: '2025-10-15T10:00:00Z', transaction_date: '2025-10-15',
      category: 'Office Supplies', payment_method: 'credit_card',
      tax_amount: 0, currency: 'CAD', user_id: 'user-1', notes: '',
    },
    {
      id: 'fraud-2', vendor_name: 'Suspicious Co', total_amount: 45000,
      fraud_reason: 'Vendor not found in CRA business registry',
      created_at: '2025-10-14T08:30:00Z', transaction_date: '2025-10-14',
      category: 'Travel', payment_method: 'credit_card',
      tax_amount: 0, currency: 'CAD', user_id: 'user-1', notes: '',
    },
  ] as ReceiptRow[],
  mathErrors: [
    {
      id: 'math-1', vendor_name: 'OfficeMax', total_amount: 134.50,
      subtotal: 100.00, tax_amount: 13.00, pst_amount: 8.00,
      created_at: '2025-10-10T09:00:00Z', transaction_date: '2025-10-10',
      category: 'Office Supplies', payment_method: 'credit_card',
      currency: 'CAD', user_id: 'user-1', notes: '',
    },
  ] as ReceiptRow[],
  missingBN: [
    {
      id: 'bn-1', vendor_name: 'Local Cafe', total_amount: 250.00,
      vendor_tax_number: null,
      created_at: '2025-10-08T12:00:00Z', transaction_date: '2025-10-08',
      category: 'Meals', payment_method: 'credit_card',
      tax_amount: 0, currency: 'CAD', user_id: 'user-1', notes: '',
    },
  ] as ReceiptRow[],
  duplicates: [
    {
      id: 'dup-1', vendor_name: 'Amazon.ca', total_amount: 124.99,
      duplicate_hash: 'a1b2c3d4e5f6',
      created_at: '2025-10-05T10:00:00Z', transaction_date: '2025-10-05',
      category: 'Office Supplies', payment_method: 'credit_card',
      tax_amount: 0, currency: 'CAD', user_id: 'user-1', notes: '',
    },
  ] as ReceiptRow[],
  spendAnomalies: [
    { vendor_name: 'Staples', latest_amount: 450.00, avg_amount: 85.00, ratio: 5.3, receipt_id: 'spend-1', transaction_date: '2025-10-12' },
    { vendor_name: 'Shell', latest_amount: 320.00, avg_amount: 65.00, ratio: 4.9, receipt_id: 'spend-2', transaction_date: '2025-10-11' },
  ],
};

const meta: Meta<typeof AnomalyDashboard> = {
  title: 'Page/AnomalyDashboard',
  component: AnomalyDashboard,
  decorators: [withProviders],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: 'Security & compliance dashboard with 5 anomaly categories: fraud suspicion, spend anomalies, math errors, missing BN, and duplicate warnings.' } },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AnomalyDashboard>;

export const Default: Story = {};

export const WithAnomalies: Story = {
  decorators: [
    withQueryData(['anomalies'], mockAnomalies),
  ],
};

export const Clean: Story = {
  decorators: [
    withQueryData(['anomalies'], {
      fraudReceipts: [],
      mathErrors: [],
      missingBN: [],
      duplicates: [],
      spendAnomalies: [],
    }),
  ],
};
