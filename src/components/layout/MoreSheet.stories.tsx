import type { Meta, StoryObj } from '@storybook/nextjs';
import MoreSheet from './MoreSheet';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof MoreSheet> = {
  title: 'Layout/MoreSheet',
  component: MoreSheet,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Slide-out sheet panel with settings and legal links. Accessible from MobileNav "More" tab.' } },
    viewport: { defaultViewport: 'mobile1' },
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MoreSheet>;

export const Visible: Story = {
  args: {
    activeTab: 'more',
    onTabChange: () => {},
    onClose: () => {},
    onSignOut: () => {},
  },
};

export const NotVisible: Story = {
  args: {
    activeTab: 'dashboard',
    onTabChange: () => {},
    onClose: () => {},
    onSignOut: () => {},
  },
};