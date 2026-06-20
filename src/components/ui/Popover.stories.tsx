import type { Meta, StoryObj } from '@storybook/nextjs';
import React from 'react';
import { Popover, PopoverTrigger, PopoverContent, PopoverArrow, PopoverClose, PopoverTitle, PopoverDescription } from './popover';
import { Button } from './button';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof Popover> = {
  title: 'UI/Popover',
  component: Popover,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Base UI Popover with rounded `[3rem]` styling, arrow, title, description, and close button. Supports portal rendering.' } },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: () => (
    <Popover defaultOpen>
      <PopoverTrigger render={<Button variant="outline">Open popover</Button>} />
      <PopoverContent>
        <PopoverArrow />
        <div className="flex flex-col gap-3">
          <div>
            <PopoverTitle>Notifications</PopoverTitle>
            <PopoverDescription>You have 3 unread notifications.</PopoverDescription>
          </div>
          <PopoverClose render={<Button size="sm">Dismiss</Button>} />
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const WithForm: Story = {
  render: () => (
    <Popover defaultOpen>
      <PopoverTrigger render={<Button variant="outline">Edit dimensions</Button>} />
      <PopoverContent className="w-64">
        <PopoverArrow />
        <div className="flex flex-col gap-3">
          <PopoverTitle>Dimensions</PopoverTitle>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-secondary">Width</label>
              <input className="h-7 rounded-[2rem] border border-glass-border bg-surface-raised px-2 text-sm outline-none focus:border-champagne/40" defaultValue="100%" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-secondary">Height</label>
              <input className="h-7 rounded-[2rem] border border-glass-border bg-surface-raised px-2 text-sm outline-none focus:border-champagne/40" defaultValue="auto" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <PopoverClose render={<Button variant="ghost" size="sm">Cancel</Button>} />
            <Button size="sm">Apply</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const WithoutArrow: Story = {
  render: () => (
    <Popover defaultOpen>
      <PopoverTrigger render={<Button variant="outline">No arrow</Button>} />
      <PopoverContent>
        <PopoverTitle>Simple popover</PopoverTitle>
        <PopoverDescription>
          This popover has no arrow indicator.
        </PopoverDescription>
      </PopoverContent>
    </Popover>
  ),
};
