import type { Meta, StoryObj } from '@storybook/nextjs';
import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, TableCaption } from './table';
import { Badge } from './badge';
import { withProviders, MOCK_RECEIPTS } from '../../../.storybook/utils';

const meta: Meta<typeof Table> = {
  title: 'UI/Table',
  component: Table,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Table component with responsive wrapper. Use with TableHeader, TableRow, TableHead, TableBody, TableCell, and TableCaption.' } },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Table>;

export const Default: Story = {
  render: () => (
    <Table>
      <TableCaption>Recent receipts</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Vendor</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {MOCK_RECEIPTS.slice(0, 5).map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-medium">{r.vendor_name}</TableCell>
            <TableCell className="tabular-nums">${r.total_amount.toFixed(2)}</TableCell>
            <TableCell>{r.transaction_date}</TableCell>
            <TableCell>
              <Badge variant={r.approval_status === 'approved' ? 'default' : r.approval_status === 'pending' ? 'secondary' : 'destructive'}>
                {r.approval_status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const Empty: Story = {
  render: () => (
    <Table>
      <TableCaption>No receipts found</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Vendor</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
            No data available
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const FullWidth: Story = {
  parameters: { viewport: { defaultViewport: 'wide' } },
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vendor</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>GST</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Reimbursement</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {MOCK_RECEIPTS.slice(0, 8).map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-medium">{r.vendor_name}</TableCell>
            <TableCell>{r.category}</TableCell>
            <TableCell className="tabular-nums">${r.total_amount.toFixed(2)}</TableCell>
            <TableCell className="tabular-nums">${r.tax_amount.toFixed(2)}</TableCell>
            <TableCell>{r.transaction_date}</TableCell>
            <TableCell>
              <Badge variant={r.approval_status === 'approved' ? 'default' : r.approval_status === 'pending' ? 'secondary' : 'destructive'}>
                {r.approval_status}
              </Badge>
            </TableCell>
            <TableCell className="text-text-muted">{r.reimbursement_status}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};
