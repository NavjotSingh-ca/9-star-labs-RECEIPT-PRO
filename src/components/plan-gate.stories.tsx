import type { Meta, StoryObj } from '@storybook/nextjs';
import { PlanGate } from './plan-gate';
import { withProviders } from '../../.storybook/utils';

const meta: Meta<typeof PlanGate> = {
  title: 'UI/PlanGate',
  component: PlanGate,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Feature gate with lock icon. Shows children when allowed, upgrade prompt when blocked.' } },
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PlanGate>;

export const Accessible: Story = {
  args: {
    plan: 'pro',
    feature: 'hasExports',
    children: <div className="p-4 rounded-xl bg-surface-raised border border-glass-border">Export feature is available</div>,
  },
};

export const Blocked: Story = {
  args: {
    plan: 'free',
    feature: 'hasExports',
    children: <div className="p-4 rounded-xl bg-surface-raised border border-glass-border">Export feature is available</div>,
  },
};

export const Fallback: Story = {
  args: {
    plan: 'free',
    feature: 'hasAdvancedReports',
    children: <div>Reports</div>,
    fallback: <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 text-warning text-sm font-semibold">Reports are not available on your plan.</div>,
  },
};
