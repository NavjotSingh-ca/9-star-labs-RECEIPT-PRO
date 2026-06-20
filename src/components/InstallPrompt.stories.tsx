import type { Meta, StoryObj } from '@storybook/nextjs';
import InstallPrompt from './InstallPrompt';
import { withProviders } from '../../.storybook/utils';

const meta: Meta<typeof InstallPrompt> = {
  title: 'UI/InstallPrompt',
  component: InstallPrompt,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'PWA install prompt banner. Shown when the `beforeinstallprompt` event fires. Animated entry/exit with spring physics. Dismissible.' } },
    viewport: { defaultViewport: 'mobile1' },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof InstallPrompt>;

export const Default: Story = {};
