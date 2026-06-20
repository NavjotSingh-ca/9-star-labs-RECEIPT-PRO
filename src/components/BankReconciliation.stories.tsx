import type { Meta, StoryObj } from '@storybook/nextjs';
import BankReconciliation from './BankReconciliation';
import { withProviders, withQueryData, MOCK_RECEIPTS } from '../../.storybook/utils';

const mockBankTransactions = [
  { id: 'bt-1', date: '2025-10-01', description: 'AMAZON.CA', amount: 124.99, matched_receipt_id: 'rec-0', is_reconciled: true },
  { id: 'bt-2', date: '2025-10-03', description: 'STAPLES CANADA', amount: 89.50, matched_receipt_id: null, is_reconciled: false },
  { id: 'bt-3', date: '2025-10-05', description: 'SHELL GAS STN #4521', amount: 65.00, matched_receipt_id: null, is_reconciled: false },
  { id: 'bt-4', date: '2025-10-08', description: 'HOME DEPOT 1234', amount: 234.00, matched_receipt_id: null, is_reconciled: false },
];

const meta: Meta<typeof BankReconciliation> = {
  title: 'Page/BankReconciliation',
  component: BankReconciliation,
  decorators: [withProviders],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: 'Bank statement upload (PDF/OFX/QFX/CSV) with AI-fuzzy matching against receipts using Levenshtein distance. Shows match confirm/reconcile workflow.' } },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof BankReconciliation>;

export const Empty: Story = {
  args: { receipts: [] },
};

export const WithReceipts: Story = {
  args: { receipts: MOCK_RECEIPTS.slice(0, 8) },
};

export const WithTransactions: Story = {
  args: { receipts: MOCK_RECEIPTS.slice(0, 8) },
  decorators: [
    withQueryData(['bank_transactions'], mockBankTransactions),
  ],
};
