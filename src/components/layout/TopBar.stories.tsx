import type { Meta, StoryObj } from '@storybook/nextjs';
import TopBar from './TopBar';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof TopBar> = {
  title: 'Layout/TopBar',
  component: TopBar,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Fixed top header bar for tablet/mobile. Shows logo, tagline, and optional children (hamburger, notifications).' } },
    viewport: { defaultViewport: 'mobile1' },
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TopBar>;

export const Default: Story = {
  args: {
    isConnected: true,
  },
};

export const Disconnected: Story = {
  args: {
    isConnected: false,
  },
};