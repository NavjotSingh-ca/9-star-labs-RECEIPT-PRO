import type { Meta, StoryObj } from '@storybook/nextjs';
import { StatCards } from './StatCards';
import { withProviders } from '../../../.storybook/utils';
import type { ReceiptRow } from '@/lib/types';

function makeReceipts(count: number, overrides?: Partial<ReceiptRow>): ReceiptRow[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `rec-${i}`,
    vendor_name: ['Amazon', 'Staples', 'Home Depot', 'Costco', 'Shell'][i % 5],
    total_amount: Math.round(Math.random() * 50000 + 1000) / 100,
    currency: 'CAD',
    tax_amount: Math.round(Math.random() * 5000) / 100,
    category: ['Office', 'Travel', 'Software', 'Meals', 'Auto'][i % 5],
    transaction_date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
    approval_status: (['approved', 'submitted', 'rejected'] as const)[i % 3],
    payment_method: 'credit_card',
    paid_by: 'company_card',
    notes: '',
    user_id: 'user-1',
    ...overrides,
  }));
}

const meta: Meta<typeof StatCards> = {
  title: 'History/StatCards',
  component: StatCards,
  decorators: [withProviders],
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StatCards>;

export const Default: Story = {
  args: {
    receipts: makeReceipts(20),
  },
};

export const AllPending: Story = {
  args: {
    receipts: makeReceipts(15, { approval_status: 'submitted' }),
  },
};

export const Empty: Story = {
  args: {
    receipts: [],
  },
};

export const SingleReceipt: Story = {
  args: {
    receipts: makeReceipts(1),
  },
};
