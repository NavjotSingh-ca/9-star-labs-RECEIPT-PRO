import type { Meta, StoryObj } from '@storybook/nextjs';
import SmoothScroll from './SmoothScroll';
import { withProviders } from '../../.storybook/utils';

const meta: Meta<typeof SmoothScroll> = {
  title: 'UI/SmoothScroll',
  component: SmoothScroll,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Lenis smooth scroll wrapper. Disables on reduced motion or viewport < 1024px.' } },
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SmoothScroll>;

export const Default: Story = {
  args: {
    children: (
      <div className="space-y-4 p-8">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-surface-raised border border-glass-border flex items-center justify-center text-text-muted">
            Section {i + 1} — scroll smoothly
          </div>
        ))}
      </div>
    ),
  },
};

export const ShortContent: Story = {
  args: {
    children: (
      <div className="p-8 text-center text-text-muted">
        <h2 className="text-xl font-bold text-text-primary mb-2">Minimal content</h2>
        <p>No scrollbar needed here.</p>
      </div>
    ),
  },
};
