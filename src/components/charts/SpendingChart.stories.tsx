import type { Meta, StoryObj } from '@storybook/react';
import { SpendingChart } from './SpendingChart';
import { withProviders, MOCK_MONTHLY_SPEND } from '../../../.storybook/utils';

const meta: Meta<typeof SpendingChart> = {
  title: 'Charts/SpendingChart',
  component: SpendingChart,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Monthly area chart with champagne gradient fill. Shows spend trajectory over time.' } },
    viewport: { defaultViewport: 'desktop' },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SpendingChart>;

export const Default: Story = {
  args: { data: MOCK_MONTHLY_SPEND },
};

export const UpwardTrend: Story = {
  args: {
    data: [
      { month: 'Jan', amount: 8000 },
      { month: 'Feb', amount: 9500 },
      { month: 'Mar', amount: 11000 },
      { month: 'Apr', amount: 13500 },
      { month: 'May', amount: 16000 },
      { month: 'Jun', amount: 19000 },
    ],
  },
};

export const DownwardTrend: Story = {
  args: {
    data: [
      { month: 'Jan', amount: 20000 },
      { month: 'Feb', amount: 17500 },
      { month: 'Mar', amount: 15000 },
      { month: 'Apr', amount: 12000 },
      { month: 'May', amount: 9000 },
      { month: 'Jun', amount: 7500 },
    ],
  },
};

export const Seasonal: Story = {
  args: {
    data: [
      { month: 'Jan', amount: 5000 },
      { month: 'Feb', amount: 5500 },
      { month: 'Mar', amount: 18000 },
      { month: 'Apr', amount: 20000 },
      { month: 'May', amount: 6000 },
      { month: 'Jun', amount: 5500 },
      { month: 'Jul', amount: 5000 },
      { month: 'Aug', amount: 4800 },
      { month: 'Sep', amount: 16000 },
      { month: 'Oct', amount: 19000 },
      { month: 'Nov', amount: 21000 },
      { month: 'Dec', amount: 25000 },
    ],
  },
};

export const Empty: Story = {
  args: { data: [] },
};

export const SingleMonth: Story = {
  args: { data: [{ month: 'Jun', amount: 12450 }] },
};
