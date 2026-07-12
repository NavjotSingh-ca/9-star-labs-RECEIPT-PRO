import type { Meta, StoryObj } from '@storybook/nextjs';
import AuditTrail from './AuditTrail';
import { withProviders, withQueryData } from '../../.storybook/utils';
import type { AuditLogRow } from '@/lib/types';

const mockAuditLogs: AuditLogRow[] = Array.from({ length: 12 }, (_, i) => ({
  id: `audit-${i}`,
  user_id: 'user-1',
  action: [
    'Receipt created - Amazon.ca - $124.99',
    'Receipt updated - Staples - $89.50',
    'Export - CRA Audit Package - 15 receipts',
    'Receipt deleted - Shell Gas - $65.00',
    'Receipt viewed - Home Depot - $234.00',
    'Bulk approved - 8 receipts',
    'Receipt created - Costco - $340.00',
    'Settings updated - Organization name',
    'Team member invited - john@example.com',
    'Export - CSV Spreadsheet - Q3 2025',
    'Receipt rejected - Starbucks - $12.50',
    'Receipt created - Loblaws - $87.30',
  ][i % 12],
  details: [
    'Vendor: Amazon.ca, Amount: $124.99, Category: Office Supplies',
    'Field changed: approval_status from submitted to approved',
    'Package included receipts.csv, LOGBOOK.csv, and 15 images',
    'Retention check passed - receipt was outside 6-year window',
    'User: user-1 @ 2025-10-15 14:32:00',
    'Receipt IDs: rec-1, rec-2, rec-3, rec-4, rec-5, rec-6, rec-7, rec-8',
    'Vendor: Costco, Amount: $340.00, Category: Groceries',
    'Field changed: name from "My Company" to "Leduc Receipt Pro"',
    'Role: Accountant, Expires: 2026-10-15',
    'Range: 2025-07-01 to 2025-09-30, Records: 42',
    'Reason: Duplicate entry detected',
    'Vendor: Loblaws, Amount: $87.30, Category: Groceries',
  ][i % 12],
  created_at: new Date(Date.now() - i * 86400000 * 2).toISOString(),
}));

const meta: Meta<typeof AuditTrail> = {
  title: 'Page/AuditTrail',
  component: AuditTrail,
  decorators: [withProviders],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: 'Infinite-scroll audit log with action type icons (create/export/edit/delete), refresh button, and compliance banner.' } },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AuditTrail>;

export const Default: Story = {};

export const WithLogs: Story = {
  decorators: [
    withQueryData(['audit_logs'], {
      pages: [{ logs: mockAuditLogs, nextOffset: undefined }],
      pageParams: [0],
    }),
  ],
};

export const Empty: Story = {};
