import type { Meta, StoryObj } from '@storybook/nextjs';
function fn<T extends (...args: any[]) => any>(_impl?: T): T {
  return ((..._args: any[]) => undefined) as T;
}
import DuplicateModal from './DuplicateModal';
import { withProviders } from '../../../.storybook/utils';
import type { ReceiptRow } from './types';

const mockDuplicate: ReceiptRow = {
  id: 'rec-123',
  user_id: 'user-1',
  vendor_name: 'Staples',
  total_amount: 142.50,
  tax_amount: 18.53,
  transaction_date: '2025-09-15',
  category: 'Office Supplies',
  payment_method: 'Visa',
  currency: 'CAD',
  notes: 'Office supplies',
  integrity_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
};

const meta: Meta<typeof DuplicateModal> = {
  title: 'Scanner/DuplicateModal',
  component: DuplicateModal,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Modal warning that a receipt may be a duplicate, showing existing record details and SHA-256 hash.' } },
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    candidate: mockDuplicate,
    onCancel: fn(),
    onContinue: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof DuplicateModal>;

export const Default: Story = {};

export const WithoutHash: Story = {
  args: {
    candidate: { ...mockDuplicate, integrity_hash: null },
  },
  parameters: { docs: { description: { story: 'Missing SHA-256 hash — hash section hidden.' } } },
};

export const NullFields: Story = {
  args: {
    candidate: {
      ...mockDuplicate,
      vendor_name: 'Unknown Vendor',
      total_amount: null as unknown as number,
      transaction_date: null as unknown as string,
      category: null as unknown as string,
      integrity_hash: null,
    },
  },
  parameters: { docs: { description: { story: 'Edge case: all fields null/empty.' } } },
};
