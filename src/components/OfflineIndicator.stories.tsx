import type { Meta, StoryObj } from '@storybook/nextjs';
import OfflineIndicator from './OfflineIndicator';
import { withProviders } from '../../.storybook/utils';

const meta: Meta<typeof OfflineIndicator> = {
  title: 'UI/OfflineIndicator',
  component: OfflineIndicator,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Offline connectivity indicator. Shows warning banner after 2s of being offline. Shows sync pending badge when back online with queued items. Uses useNetworkStatus + useOfflineQueue hooks.' } },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof OfflineIndicator>;

export const Default: Story = {};
