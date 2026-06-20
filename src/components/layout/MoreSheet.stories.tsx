import type { Meta, StoryObj } from '@storybook/nextjs';
import MoreSheet from './MoreSheet';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof MoreSheet> = {
  title: 'Layout/MoreSheet',
  component: MoreSheet,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Slide-out sheet panel showing all secondary navigation items (audit, reports, approvals, billing, etc). Accessible from MobileNav "More" tab.' } },
    viewport: { defaultViewport: 'mobile1' },
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MoreSheet>;

export const OwnerView: Story = {
  args: {
    activeTab: 'more',
    onTabChange: () => {},
    onClose: () => {},
    role: 'Owner',
    planLabel: 'Pro',
    plan: 'pro',
    openInviteModal: () => {},
    onSignOut: () => {},
  },
};

export const EmployeeView: Story = {
  args: {
    activeTab: 'more',
    onTabChange: () => {},
    onClose: () => {},
    role: 'Employee',
    planLabel: 'Free',
    plan: 'free',
    openInviteModal: () => {},
    onSignOut: () => {},
  },
};

export const AccountantView: Story = {
  args: {
    activeTab: 'more',
    onTabChange: () => {},
    onClose: () => {},
    role: 'Accountant',
    planLabel: 'Enterprise',
    plan: 'enterprise',
    openInviteModal: () => {},
    onSignOut: () => {},
  },
};

export const NotVisible: Story = {
  args: {
    activeTab: 'dashboard',
    onTabChange: () => {},
    onClose: () => {},
    role: 'Owner',
    planLabel: 'Pro',
    plan: 'pro',
    openInviteModal: () => {},
    onSignOut: () => {},
  },
};
