import type { Meta, StoryObj } from '@storybook/nextjs';
import ReceiptDetailDrawer from './ReceiptDetailDrawer';
import { withProviders } from '../../../.storybook/utils';
import type { ReceiptRow } from '@/lib/types';

const baseReceipt: ReceiptRow = {
  id: 'rec-detail-1',
  vendor_name: 'Amazon.ca',
  vendor_address: '123 Main St, Toronto, ON',
  business_number: '123456789RT0001',
  total_amount: 124.99,
  currency: 'CAD',
  tax_amount: 16.25,
  pst_amount: 9.99,
  category: 'Office Supplies',
  transaction_date: '2025-10-15',
  approval_status: 'submitted',
  payment_method: 'credit_card',
  paid_by: 'employee_cash',
  notes: 'Office supplies for Q4',
  confidence_score: 92,
  user_id: 'user-1',
  reimbursement_status: 'pending',
  needs_reimbursement: true,
};

const noop = () => {};

const meta: Meta<typeof ReceiptDetailDrawer> = {
  title: 'History/ReceiptDetailDrawer',
  component: ReceiptDetailDrawer,
  decorators: [(Story) => <div className="max-w-3xl mx-auto">{withProviders(Story)}</div>],
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ReceiptDetailDrawer>;

export const PendingApproval: Story = {
  args: {
    receipt: baseReceipt,
    onClose: noop,
    role: 'Owner',
    onUpdate: noop,
  },
};

export const Approved: Story = {
  args: {
    receipt: { ...baseReceipt, approval_status: 'approved', confidence_score: 97 },
    onClose: noop,
    role: 'Owner',
    onUpdate: noop,
  },
};

export const Rejected: Story = {
  args: {
    receipt: { ...baseReceipt, approval_status: 'rejected', confidence_score: 45 },
    onClose: noop,
    role: 'Owner',
    onUpdate: noop,
  },
};

export const AccountantView: Story = {
  args: {
    receipt: baseReceipt,
    onClose: noop,
    role: 'Accountant',
    onUpdate: noop,
  },
};
