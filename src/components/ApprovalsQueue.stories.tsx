import type { Meta, StoryObj } from '@storybook/nextjs';
import ApprovalsQueue from './ApprovalsQueue';
import { withProviders, withQueryData } from '../../.storybook/utils';
import type { ReceiptRow } from '@/lib/types';

const mockPending: ReceiptRow[] = [
  {
    id: 'rec-p1', vendor_name: 'Amazon.ca', total_amount: 124.99, currency: 'CAD',
    tax_amount: 16.25, category: 'Office Supplies', transaction_date: '2025-10-15',
    approval_status: 'submitted', payment_method: 'credit_card', paid_by: 'company_card',
    user_id: 'user-1', notes: '',
  },
  {
    id: 'rec-p2', vendor_name: 'Staples Canada', total_amount: 89.50, currency: 'CAD',
    tax_amount: 11.64, category: 'Office Supplies', transaction_date: '2025-10-14',
    approval_status: 'submitted', payment_method: 'credit_card', paid_by: 'company_card',
    user_id: 'user-1', notes: '',
  },
  {
    id: 'rec-p3', vendor_name: 'Home Depot', total_amount: 234.00, currency: 'CAD',
    tax_amount: 30.42, category: 'Construction', transaction_date: '2025-10-13',
    approval_status: 'submitted', payment_method: 'credit_card', paid_by: 'employee_cash',
    needs_reimbursement: true, user_id: 'user-1', notes: '',
  },
  {
    id: 'rec-p4', vendor_name: 'Shell Gas', total_amount: 65.00, currency: 'CAD',
    tax_amount: 8.45, category: 'Fuel', transaction_date: '2025-10-12',
    approval_status: 'submitted', payment_method: 'credit_card', paid_by: 'company_card',
    user_id: 'user-1', notes: '', fraud_suspicion: true,
    fraud_reason: 'Unusual pattern detected',
  },
];

const meta: Meta<typeof ApprovalsQueue> = {
  title: 'Page/ApprovalsQueue',
  component: ApprovalsQueue,
  decorators: [withProviders],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: 'Approval cards with approve/reject buttons, bulk actions, keyboard shortcuts (A/R), and loading skeleton.' } },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ApprovalsQueue>;

export const Empty: Story = {
  args: { role: 'Owner' },
};

export const WithPending: Story = {
  args: { role: 'Owner' },
  decorators: [withQueryData(['approvals_pending'], mockPending)],
};

export const EmployeeAccessDenied: Story = {
  args: { role: 'Employee' },
};
