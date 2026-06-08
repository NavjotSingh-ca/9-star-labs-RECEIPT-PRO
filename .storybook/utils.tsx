import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, gcTime: 0 },
    mutations: { retry: false },
  },
});

export function withProviders(Story: React.ComponentType) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <Story />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export const MOCK_RECEIPTS = Array.from({ length: 50 }, (_, i) => ({
  id: `rec-${i}`,
  vendor_name: ['Amazon', 'Staples', 'Home Depot', 'Costco', 'Shell'][i % 5],
  total_amount: Math.round(Math.random() * 50000) / 100,
  cad_equivalent: null,
  currency: 'CAD',
  tax_amount: Math.round(Math.random() * 5000) / 100,
  pst_amount: 0,
  category: ['Office', 'Travel', 'Software', 'Meals', 'Auto'][i % 5],
  transaction_date: new Date(Date.now() - Math.random() * 90 * 86400000).toISOString().split('T')[0],
  receipt_url: null,
  description: null,
  approval_status: ['approved', 'pending', 'flagged'][i % 3] as 'approved' | 'pending' | 'flagged',
  paid_by: 'employee_cash',
  payment_account: null,
  payment_date: null,
  reimbursement_status: 'pending',
  business_unit_id: null,
  project_id: null,
  org_id: 'org-1',
  user_id: 'user-1',
  is_deleted: false,
  duplicate_hash: null,
  flagged_audit: false,
  comment: null,
}));

export const MOCK_DAILY_SPEND = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
  amount: Math.round(Math.random() * 50000) / 100,
}));

export const MOCK_CATEGORIES = [
  { name: 'Office Supplies', amount: 12450 },
  { name: 'Travel', amount: 8900 },
  { name: 'Software', amount: 7200 },
  { name: 'Meals & Entertainment', amount: 5400 },
  { name: 'Auto', amount: 3100 },
  { name: 'Utilities', amount: 2100 },
  { name: 'Professional Services', amount: 1800 },
];

export const MOCK_MONTHLY_SPEND = [
  { month: 'Jan', amount: 12400 },
  { month: 'Feb', amount: 14800 },
  { month: 'Mar', amount: 11200 },
  { month: 'Apr', amount: 16800 },
  { month: 'May', amount: 13500 },
  { month: 'Jun', amount: 19200 },
];

export const MOCK_SPARKLINE = Array.from({ length: 7 }, (_, i) => ({
  date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0],
  amount: Math.round(Math.random() * 10000 + 5000) / 100,
}));
