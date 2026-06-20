import type { Meta, StoryObj } from '@storybook/nextjs';
import Providers from './Providers';

const meta: Meta<typeof Providers> = {
  title: 'UI/Providers',
  component: Providers,
  parameters: {
    docs: { description: { component: 'Root providers wrapper: QueryClientProvider, NuqsAdapter, ReactQueryDevtools, ThemeProvider, MotionConfig. Wraps the app with all context providers needed.' } },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Providers>;

export const Default: Story = {
  render: () => (
    <Providers>
      <div className="p-8 text-center">
        <p className="text-text-primary font-bold">Children render inside all providers</p>
        <p className="text-text-secondary text-sm mt-2">React Query, Theme, MotionConfig, nuqs are all available.</p>
      </div>
    </Providers>
  ),
};
