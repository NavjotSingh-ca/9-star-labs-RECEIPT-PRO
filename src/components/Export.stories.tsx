import type { Meta, StoryObj } from '@storybook/nextjs';
import Export from './Export';
import { withProviders, withQueryData, MOCK_RECEIPTS } from '../../.storybook/utils';

const meta: Meta<typeof Export> = {
  title: 'Page/Export',
  component: Export,
  decorators: [withProviders],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: 'CRA export tools: CSV, ZIP audit package, IDEA CSV, and PDF generation. Plan-gated behind hasExports feature. Shows total/GST/PST/pending claims summary.' } },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Export>;

export const Empty: Story = {
  args: { receipts: [] },
  decorators: [
    withQueryData(['subscription'], { plan: 'pro', status: 'active' as const }),
  ],
};

export const WithReceipts: Story = {
  args: { receipts: MOCK_RECEIPTS.slice(0, 10) },
  decorators: [
    withQueryData(['subscription'], { plan: 'pro', status: 'active' as const }),
  ],
};

export const PlanGated: Story = {
  args: { receipts: MOCK_RECEIPTS.slice(0, 10) },
  decorators: [
    withQueryData(['subscription'], null),
  ],
};
