import type { Meta, StoryObj } from '@storybook/nextjs';
import { Sparkline } from './Sparkline';
import { MOCK_SPARKLINE } from '../../../.storybook/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const meta: Meta<typeof Sparkline> = {
  title: 'Charts/Sparkline',
  component: Sparkline,
  parameters: {
    docs: { description: { component: 'Inline 7-day trend sparkline for embedding in KPI cards. Minimal, no labels — just the line.' } },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Sparkline>;

export const Default: Story = {
  args: { data: MOCK_SPARKLINE },
};

export const Champagne: Story = {
  args: { data: MOCK_SPARKLINE, color: 'var(--champagne)' },
};

export const Emerald: Story = {
  args: { data: MOCK_SPARKLINE, color: 'var(--emerald-light)' },
};

export const Warning: Story = {
  args: { data: MOCK_SPARKLINE, color: 'var(--warning)' },
};

export const Upward: Story = {
  args: {
    data: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0],
      amount: 5000 + i * 1200,
    })),
  },
};

export const Downward: Story = {
  args: {
    data: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0],
      amount: 12000 - i * 1500,
    })),
  },
};

export const InCard: Story = {
  render: () => (
    <Card className="max-w-xs">
      <CardHeader>
        <CardTitle>Weekly Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <span className="text-2xl font-bold tabular-nums text-champagne">$8,450</span>
          <Sparkline data={MOCK_SPARKLINE} color="var(--champagne)" />
        </div>
      </CardContent>
    </Card>
  ),
};

export const Flat: Story = {
  args: {
    data: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0],
      amount: 5000,
    })),
  },
};
