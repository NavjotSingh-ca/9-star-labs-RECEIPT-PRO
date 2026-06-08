import type { Meta, StoryObj } from '@storybook/react';
import { DashboardSkeleton, ReceiptTableSkeleton } from './PremiumSkeletons';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof DashboardSkeleton> = {
  title: 'UI/PremiumSkeletons',
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Motion-animated skeleton layouts for dashboard and table loading states. Uses Framer Motion staggered entrance animations.' } },
  },
  tags: ['autodocs'],
};

export default meta;

export const Dashboard: StoryObj<typeof DashboardSkeleton> = {
  render: () => <DashboardSkeleton />,
};

export const ReceiptTable: StoryObj<typeof ReceiptTableSkeleton> = {
  render: () => <ReceiptTableSkeleton />,
};
