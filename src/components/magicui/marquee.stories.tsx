import type { Meta, StoryObj } from '@storybook/nextjs';
import { Marquee } from './marquee';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof Marquee> = {
  title: 'MagicUI/Marquee',
  component: Marquee,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Auto-scrolling marquee with horizontal and vertical variants. Pause on hover support.' } },
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Marquee>;

const items = ['Receipts', 'Invoices', 'Statements', 'Estimates', 'Reports'];

export const Horizontal: Story = {
  args: {
    children: (
      <>
        {items.map((item) => (
          <div key={item} className="mx-4 rounded-xl bg-surface-raised border border-glass-border px-6 py-3 text-sm font-semibold text-text-primary whitespace-nowrap">
            {item}
          </div>
        ))}
      </>
    ),
  },
};

export const PauseOnHover: Story = {
  args: {
    pauseOnHover: true,
    children: (
      <>
        {items.map((item) => (
          <div key={item} className="mx-4 rounded-xl bg-surface-raised border border-glass-border px-6 py-3 text-sm font-semibold text-text-primary whitespace-nowrap">
            {item}
          </div>
        ))}
      </>
    ),
  },
  parameters: { docs: { description: { story: 'Animation pauses when user hovers over the marquee.' } } },
};

export const Reverse: Story = {
  args: {
    reverse: true,
    children: (
      <>
        {items.map((item) => (
          <div key={item} className="mx-4 rounded-xl bg-surface-raised border border-glass-border px-6 py-3 text-sm font-semibold text-text-primary whitespace-nowrap">
            {item}
          </div>
        ))}
      </>
    ),
  },
};
