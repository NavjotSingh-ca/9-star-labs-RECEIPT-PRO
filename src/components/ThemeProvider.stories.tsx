import type { Meta, StoryObj } from '@storybook/nextjs';
import { ThemeProvider } from './ThemeProvider';
import { withProviders } from '../../.storybook/utils';

const meta: Meta<typeof ThemeProvider> = {
  title: 'UI/ThemeProvider',
  component: ThemeProvider,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'next-themes wrapper. Sets attribute="class", defaultTheme="system", enables system detection.' } },
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ThemeProvider>;

export const Default: Story = {
  args: {
    children: (
      <div className="p-6 rounded-2xl bg-surface-raised border border-glass-border text-center">
        <p className="text-sm text-text-primary font-semibold">ThemeProvider active</p>
        <p className="text-xs text-text-muted mt-1">Toggle theme in Storybook toolbar to see dark/light mode</p>
      </div>
    ),
  },
};
