import type { Meta, StoryObj } from '@storybook/nextjs';
import React from 'react';
import { ScrollArea } from './scroll-area';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof ScrollArea> = {
  title: 'UI/ScrollArea',
  component: ScrollArea,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Custom scrollable container with design system scrollbar styling using `--glass-border` CSS variables. Supports vertical and horizontal orientation.' } },
  },
  argTypes: {
    orientation: { control: 'select', options: ['vertical', 'horizontal'] },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ScrollArea>;

const LONG_CONTENT = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  text: `Item ${i + 1}: The quick brown fox jumps over the lazy dog.`,
}));

export const Default: Story = {
  render: () => (
    <div className="h-48 w-80 rounded-[2rem] border border-glass-border">
      <ScrollArea className="h-full p-4">
        <div className="space-y-2">
          {LONG_CONTENT.map((item) => (
            <div key={item.id} className="text-sm text-text-secondary">{item.text}</div>
          ))}
        </div>
      </ScrollArea>
    </div>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <div className="w-80 rounded-[2rem] border border-glass-border">
      <ScrollArea orientation="horizontal" className="p-4">
        <div className="flex gap-4" style={{ width: '800px' }}>
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="flex-shrink-0 w-32 h-20 rounded-[2rem] bg-surface-raised border border-glass-border flex items-center justify-center text-sm text-text-secondary">
              Card {i + 1}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  ),
};

export const InCard: Story = {
  render: () => (
    <div className="max-w-sm rounded-[2rem] border border-glass-border bg-surface shadow-sm">
      <div className="p-4 border-b border-glass-border">
        <div className="text-sm font-medium">Recent Activity</div>
      </div>
      <ScrollArea className="h-48">
        <div className="p-2 space-y-1">
          {LONG_CONTENT.map((item) => (
            <div key={item.id} className="px-3 py-2 text-sm text-text-secondary hover:bg-surface-hover rounded-[2rem] transition-colors">
              {item.text}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  ),
};
