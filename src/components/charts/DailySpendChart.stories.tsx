import type { Meta, StoryObj } from '@storybook/react';
import { DailySpendChart } from './DailySpendChart';
import { withProviders, MOCK_DAILY_SPEND } from '../../../.storybook/utils';

const meta: Meta<typeof DailySpendChart> = {
  title: 'Charts/DailySpendChart',
  component: DailySpendChart,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: '30-day bar chart of daily spending. Today is highlighted in emerald. Empty state shown when <3 data points.' } },
    viewport: { defaultViewport: 'desktop' },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DailySpendChart>;

export const Default: Story = {
  args: { data: MOCK_DAILY_SPEND },
};

export const Empty: Story = {
  args: { data: [] },
};

export const Partial: Story = {
  args: { data: MOCK_DAILY_SPEND.slice(0, 2) },
};

export const WithHighVariance: Story = {
  args: {
    data: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split('T')[0],
      amount: Math.random() > 0.7 ? Math.round(Math.random() * 150000) / 100 : Math.round(Math.random() * 10000) / 100,
    })),
  },
};
