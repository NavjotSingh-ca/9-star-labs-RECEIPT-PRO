import type { Meta, StoryObj } from '@storybook/nextjs';
import React from 'react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent, TooltipArrow } from './tooltip';
import { Button } from './button';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof Tooltip> = {
  title: 'UI/Tooltip',
  component: Tooltip,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Base UI Tooltip with dark sidebar-bg styling. Shows on hover/focus with delay. Supports arrow and positioning.' } },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline">Hover me</Button>} />
        <TooltipContent>
          Hello, I&apos;m a tooltip!
          <TooltipArrow />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};

export const SidePositions: Story = {
  render: () => (
    <TooltipProvider>
      <div className="flex gap-8 items-center justify-center p-16">
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline">Top</Button>} />
          <TooltipContent>
            Tooltip on top
            <TooltipArrow />
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline">Bottom</Button>} />
          <TooltipContent>
            Tooltip on bottom
            <TooltipArrow />
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline">Left</Button>} />
          <TooltipContent>
            Tooltip on left
            <TooltipArrow />
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline">Right</Button>} />
          <TooltipContent>
            Tooltip on right
            <TooltipArrow />
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
};

export const WithoutArrow: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline">No arrow</Button>} />
        <TooltipContent>
          Just the tooltip
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};

export const WithDelay: Story = {
  render: () => (
    <TooltipProvider delay={1000}>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline">1s delay</Button>} />
        <TooltipContent>
          Waited 1 second
          <TooltipArrow />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};

export const Disabled: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline" disabled>Disabled</Button>} />
        <TooltipContent>
          Won&apos;t show
          <TooltipArrow />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};
