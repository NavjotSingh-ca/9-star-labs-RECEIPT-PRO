import type { Meta, StoryObj } from '@storybook/nextjs';
import React from 'react';
import { Progress, ProgressValue } from './progress';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof Progress> = {
  title: 'UI/Progress',
  component: Progress,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Base UI Progress bar with animated indicator. Supports color variants: default (champagne), success (emerald), warning, and danger.' } },
  },
  argTypes: {
    value: { control: { type: 'number', min: 0, max: 100 } },
    color: { control: 'select', options: ['default', 'success', 'warning', 'danger'] },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = {
  args: { value: 60 },
};

export const AtZero: Story = {
  args: { value: 0 },
};

export const AtFifty: Story = {
  args: { value: 50 },
};

export const Complete: Story = {
  args: { value: 100 },
};

export const ColorVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6 max-w-sm">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Default</span>
          <ProgressValue>75%</ProgressValue>
        </div>
        <Progress value={75} color="default" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Success</span>
          <ProgressValue>100%</ProgressValue>
        </div>
        <Progress value={100} color="success" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Warning</span>
          <ProgressValue>45%</ProgressValue>
        </div>
        <Progress value={45} color="warning" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Danger</span>
          <ProgressValue>20%</ProgressValue>
        </div>
        <Progress value={20} color="danger" />
      </div>
    </div>
  ),
};

export const InCard: Story = {
  render: () => (
    <div className="max-w-sm rounded-[2rem] border border-glass-border bg-surface p-4 shadow-sm">
      <div className="flex flex-col gap-2 mb-3">
        <div className="text-sm font-medium">Project Completion</div>
        <div className="text-xs text-text-muted">Q4 Financial Audit</div>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs">
          <span className="text-text-secondary">Overall progress</span>
          <ProgressValue>68%</ProgressValue>
        </div>
        <Progress value={68} color="default" />
      </div>
    </div>
  ),
};

export const Indeterminate: Story = {
  args: { value: null },
};
