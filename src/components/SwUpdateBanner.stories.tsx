import type { Meta, StoryObj } from '@storybook/nextjs';
import SwUpdateBanner from './SwUpdateBanner';
import { withProviders } from '../../.storybook/utils';

const meta: Meta<typeof SwUpdateBanner> = {
  title: 'UI/SwUpdateBanner',
  component: SwUpdateBanner,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Service Worker update banner. Pill-style notification when a new SW version is available. Shows "Update" button that triggers SKIP_WAITING + reload.' } },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SwUpdateBanner>;

export const Default: Story = {};
