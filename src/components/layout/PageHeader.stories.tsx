import type { Meta, StoryObj } from '@storybook/nextjs';
import PageHeader from './PageHeader';
import { withProviders } from '../../../.storybook/utils';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const meta: Meta<typeof PageHeader> = {
  title: 'Layout/PageHeader',
  component: PageHeader,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Reusable page header with title, optional subtitle, and optional action element. Animated entrance via framer-motion.' } },
    viewport: { defaultViewport: 'desktop' },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PageHeader>;

export const Default: Story = {
  args: {
    title: 'Receipts',
    subtitle: 'Browse and manage all captured receipts.',
  },
};

export const TitleOnly: Story = {
  args: {
    title: 'Dashboard',
  },
};

export const WithAction: Story = {
  render: () => (
    <PageHeader
      title="Projects"
      subtitle="Manage project budgets and track spend."
      action={<Button size="sm"><Plus className="size-4" /> New Project</Button>}
    />
  ),
};

export const LongTitle: Story = {
  args: {
    title: 'Audit Trail & Compliance History',
    subtitle: 'Immutable Merkle-chain verified log of all receipt actions within your organization.',
  },
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  args: {
    title: 'Settings',
    subtitle: 'Manage your organization preferences.',
  },
};
