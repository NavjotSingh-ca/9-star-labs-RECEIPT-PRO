import type { Meta, StoryObj } from '@storybook/nextjs';
import TopBar from './TopBar';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof TopBar> = {
  title: 'Layout/TopBar',
  component: TopBar,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Fixed top header bar for tablet/mobile. Shows logo, tagline, plan badge, and optional children (hamburger, notifications).' } },
    viewport: { defaultViewport: 'mobile1' },
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TopBar>;

export const Default: Story = {
  args: {
    planLabel: 'Pro',
    plan: 'pro',
    planLoading: false,
  },
};

export const FreePlan: Story = {
  args: {
    planLabel: 'Free',
    plan: 'free',
    planLoading: false,
  },
};

export const EnterprisePlan: Story = {
  args: {
    planLabel: 'Enterprise',
    plan: 'enterprise',
    planLoading: false,
  },
};

export const LoadingPlan: Story = {
  args: {
    planLabel: '',
    plan: 'free',
    planLoading: true,
  },
};
