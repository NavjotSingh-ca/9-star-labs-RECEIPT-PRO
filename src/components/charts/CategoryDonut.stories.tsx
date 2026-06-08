import type { Meta, StoryObj } from '@storybook/react';
import { CategoryDonut } from './CategoryDonut';
import { withProviders, MOCK_CATEGORIES } from '../../../.storybook/utils';

const meta: Meta<typeof CategoryDonut> = {
  title: 'Charts/CategoryDonut',
  component: CategoryDonut,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Donut chart showing spending distribution by category. Top 5 categories shown in legend. Empty state displayed when <3 categories.' } },
    viewport: { defaultViewport: 'desktop' },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CategoryDonut>;

export const Default: Story = {
  args: { data: MOCK_CATEGORIES },
};

export const SingleCategory: Story = {
  args: { data: [{ name: 'Office Supplies', amount: 12450 }] },
};

export const Empty: Story = {
  args: { data: [] },
};

export const ManyCategories: Story = {
  args: {
    data: [
      { name: 'Office Supplies', amount: 12450 },
      { name: 'Travel', amount: 8900 },
      { name: 'Software Subscriptions', amount: 7200 },
      { name: 'Meals & Entertainment', amount: 5400 },
      { name: 'Auto & Fuel', amount: 3100 },
      { name: 'Utilities', amount: 2100 },
      { name: 'Professional Services', amount: 1800 },
      { name: 'Rent', amount: 4500 },
      { name: 'Insurance', amount: 1200 },
      { name: 'Marketing', amount: 3200 },
    ],
  },
};

export const UnevenDistribution: Story = {
  args: {
    data: [
      { name: 'Rent', amount: 45000 },
      { name: 'Office', amount: 3200 },
      { name: 'Software', amount: 2400 },
      { name: 'Travel', amount: 1800 },
      { name: 'Meals', amount: 900 },
    ],
  },
};
