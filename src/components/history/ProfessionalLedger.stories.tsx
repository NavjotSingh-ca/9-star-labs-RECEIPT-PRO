import type { Meta, StoryObj } from '@storybook/nextjs';
import { ProfessionalLedger } from './ProfessionalLedger';
import { withProviders } from '../../../.storybook/utils';
import type { ReceiptRow } from '@/lib/types';

const mockReceipts: ReceiptRow[] = Array.from({ length: 12 }, (_, i) => ({
  id: `rec-${i}`,
  vendor_name: ['Amazon', 'Staples', 'Home Depot', 'Costco', 'Shell', 'Loblaws'][i % 6],
  total_amount: [4500, 2300, 12000, 8900, 650, 3400][i % 6],
  currency: 'CAD',
  tax_amount: [225, 115, 600, 445, 33, 170][i % 6],
  category: ['Office Supplies', 'Travel', 'Construction', 'Groceries', 'Fuel', 'Software'][i % 6],
  transaction_date: new Date(Date.now() - i * 3 * 86400000).toISOString().split('T')[0],
  approval_status: (['approved', 'submitted', 'rejected'] as const)[i % 3],
  payment_method: 'credit_card',
  paid_by: i % 2 === 0 ? 'company_card' : 'employee_cash',
  notes: '',
  user_id: 'user-1',
}));

const meta: Meta<typeof ProfessionalLedger> = {
  title: 'History/ProfessionalLedger',
  component: ProfessionalLedger,
  decorators: [withProviders],
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ProfessionalLedger>;

const noop = () => {};

export const Default: Story = {
  args: {
    data: mockReceipts,
    onSelect: noop,
    onDelete: noop,
    selectedIds: [],
    onSelectionChange: noop,
  },
};

export const WithSelection: Story = {
  args: {
    ...Default.args,
    selectedIds: [mockReceipts[0].id, mockReceipts[2].id, mockReceipts[5].id],
  },
};

export const Empty: Story = {
  args: {
    data: [],
    onSelect: noop,
    onDelete: noop,
    selectedIds: [],
    onSelectionChange: noop,
  },
};

export const SingleRow: Story = {
  args: {
    ...Default.args,
    data: mockReceipts.slice(0, 1),
  },
};
