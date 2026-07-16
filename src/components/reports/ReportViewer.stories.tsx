import type { Meta, StoryObj } from '@storybook/nextjs';
import { ReportViewer } from './ReportViewer';
import { withProviders } from '../../../.storybook/utils';
import type { ReportResult } from '@/lib/services/reports';

const groupedResult: ReportResult = {
  config: { metrics: ['total_spend', 'receipt_count'], groupBy: 'vendor', datePreset: 'this_year' },
  rows: [
    { vendor: 'Amazon', total_spend: 12450.00, receipt_count: 23 },
    { vendor: 'Staples', total_spend: 8900.00, receipt_count: 15 },
    { vendor: 'Home Depot', total_spend: 7200.00, receipt_count: 8 },
    { vendor: 'Shell', total_spend: 5400.00, receipt_count: 12 },
    { vendor: 'Costco', total_spend: 3100.00, receipt_count: 5 },
  ],
  totals: { total_spend: 37050.00, receipt_count: 63 },
  generatedAt: new Date().toISOString(),
};

const ungroupedResult: ReportResult = {
  config: { metrics: ['total_spend', 'receipt_count', 'avg_receipt', 'tax_total'], groupBy: null, datePreset: 'this_year' },
  rows: [
    { total_spend: 124500.00, receipt_count: 245, avg_receipt: 508.16, tax_total: 16185.00 },
  ],
  totals: { total_spend: 124500.00, receipt_count: 245, avg_receipt: 508.16, tax_total: 16185.00 },
  generatedAt: new Date().toISOString(),
};

const emptyResult: ReportResult = {
  config: { metrics: ['total_spend', 'receipt_count'], groupBy: 'category', datePreset: 'this_year' },
  rows: [],
  totals: { total_spend: 0, receipt_count: 0 },
  generatedAt: new Date().toISOString(),
};

const meta: Meta<typeof ReportViewer> = {
  title: 'Reports/ReportViewer',
  component: ReportViewer,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Report results table with grouped or ungrouped display. Export buttons for CSV/JSON.' } },
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ReportViewer>;

export const GroupedByVendor: Story = {
  args: { result: groupedResult, templateName: 'Vendor Spend Analysis' },
};

export const UngroupedTotals: Story = {
  args: { result: ungroupedResult, templateName: 'GST/HST Claim Summary' },
  parameters: { docs: { description: { story: 'Single total row — shows metric cards instead of table.' } } },
};

export const Empty: Story = {
  args: { result: emptyResult, templateName: 'Category Breakdown' },
  parameters: { docs: { description: { story: 'No data matches filters — shows empty state message.' } } },
};

export const WithManyMetrics: Story = {
  args: {
    result: {
      ...ungroupedResult,
      config: { metrics: ['total_spend', 'receipt_count', 'avg_receipt', 'max_receipt', 'tax_total'], groupBy: null, datePreset: 'this_year' },
    },
    templateName: 'Annual Comparison',
  },
};
