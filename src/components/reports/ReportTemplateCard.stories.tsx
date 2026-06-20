import type { Meta, StoryObj } from '@storybook/nextjs';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fn<T extends (...args: any[]) => any>(_impl?: T): T {
  return ((..._args: any[]) => undefined) as T;
}
import { ReportTemplateCard } from './ReportTemplateCard';
import { withProviders } from '../../../.storybook/utils';
import type { ReportTemplate } from '@/lib/services/reports';

const defaultTemplate: ReportTemplate = {
  id: 'gst-hst-summary',
  name: 'GST/HST Claim Summary',
  description: 'Total tax paid this quarter — ready for filing',
  icon: 'FileText',
  type: 'builtin',
  defaultExport: 'pdf',
  config: { metrics: ['tax_total', 'receipt_count'], groupBy: null, datePreset: 'last_quarter' },
};

const meta: Meta<typeof ReportTemplateCard> = {
  title: 'Reports/ReportTemplateCard',
  component: ReportTemplateCard,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Card for a report template with icon, name, description, export type badge. Hover scale effect on click.' } },
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    template: defaultTemplate,
    onGenerate: fn(),
    isGenerating: false,
  },
};

export default meta;
type Story = StoryObj<typeof ReportTemplateCard>;

export const Default: Story = {};

export const Generating: Story = {
  args: { isGenerating: true },
};

export const CustomType: Story = {
  args: {
    template: { ...defaultTemplate, id: 'custom-1', type: 'custom', icon: 'FileSpreadsheet', name: 'My Custom Report', description: 'Custom report created from builder' },
  },
};

export const VendorSpend: Story = {
  args: {
    template: {
      id: 'vendor-spend',
      name: 'Vendor Spend Analysis',
      description: 'See where your money goes — spend by vendor',
      icon: 'Building2',
      type: 'builtin',
      defaultExport: 'csv',
      config: { metrics: ['total_spend', 'receipt_count', 'avg_receipt'], groupBy: 'vendor', datePreset: 'this_year' },
    },
  },
};

export const LongDescription: Story = {
  args: {
    template: {
      ...defaultTemplate,
      name: 'Annual Multi-Department Comparison Report',
      description: 'Compare monthly spending across departments, business units, and projects over two fiscal years with year-over-year variance analysis.',
    },
  },
};
