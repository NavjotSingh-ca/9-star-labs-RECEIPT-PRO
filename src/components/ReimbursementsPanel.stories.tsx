import type { Meta, StoryObj } from '@storybook/nextjs';
import ReimbursementsPanel from './ReimbursementsPanel';
import { withProviders, withQueryData } from '../../.storybook/utils';
import type { ReceiptRow } from '@/lib/types';

const mockPayables: ReceiptRow[] = [
  {
    id: 'rec-r1', vendor_name: 'Costco', total_amount: 340.00, currency: 'CAD',
    tax_amount: 44.20, category: 'Groceries', transaction_date: '2025-10-10',
    approval_status: 'approved', payment_method: 'credit_card', paid_by: 'employee_cash',
    reimbursement_status: 'pending', needs_reimbursement: true, user_id: 'user-1', notes: '',
  },
  {
    id: 'rec-r2', vendor_name: 'Loblaws', total_amount: 125.50, currency: 'CAD',
    tax_amount: 16.32, category: 'Groceries', transaction_date: '2025-10-08',
    approval_status: 'approved', payment_method: 'debit_card', paid_by: 'employee_cash',
    reimbursement_status: 'pending', needs_reimbursement: true, user_id: 'user-1', notes: '',
  },
  {
    id: 'rec-r3', vendor_name: 'Shell Gas', total_amount: 89.99, currency: 'CAD',
    tax_amount: 11.70, category: 'Fuel', transaction_date: '2025-10-05',
    approval_status: 'approved', payment_method: 'credit_card', paid_by: 'employee_cash',
    reimbursement_status: 'pending', needs_reimbursement: true, user_id: 'user-1', notes: '',
  },
];

const mockPaid: ReceiptRow[] = [
  {
    id: 'rec-r4', vendor_name: 'Starbucks', total_amount: 12.50, currency: 'CAD',
    tax_amount: 1.63, category: 'Meals', transaction_date: '2025-10-01',
    approval_status: 'approved', payment_method: 'credit_card', paid_by: 'employee_cash',
    reimbursement_status: 'approved', needs_reimbursement: true, user_id: 'user-1', notes: '',
  },
  {
    id: 'rec-r5', vendor_name: 'Uber Eats', total_amount: 45.00, currency: 'CAD',
    tax_amount: 5.85, category: 'Meals', transaction_date: '2025-09-28',
    approval_status: 'approved', payment_method: 'credit_card', paid_by: 'employee_cash',
    reimbursement_status: 'approved', needs_reimbursement: true, user_id: 'user-1', notes: '',
  },
];

const meta: Meta<typeof ReimbursementsPanel> = {
  title: 'Page/ReimbursementsPanel',
  component: ReimbursementsPanel,
  decorators: [withProviders],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: 'Employee cash reimbursement workflow with Mark Paid button, outstanding total, and loading skeleton.' } },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ReimbursementsPanel>;

export const Empty: Story = {
  args: { role: 'Owner' },
};

export const WithPayables: Story = {
  args: { role: 'Owner' },
  decorators: [withQueryData(['reimbursements_pending'], mockPayables)],
};

export const WithPaidItems: Story = {
  args: { role: 'Owner' },
  decorators: [withQueryData(['reimbursements_pending'], mockPaid)],
};

export const EmployeeHidden: Story = {
  args: { role: 'Employee' },
};
