import type { Meta, StoryObj } from '@storybook/nextjs';
import { Skeleton } from './skeleton';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof Skeleton> = {
  title: 'UI/Skeleton',
  component: Skeleton,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Sophisticated shimmer loading placeholder. Uses `bg-gradient-to-r from-surface via-surface-raised to-surface` with `animate-[shimmer_1.5s_ease-in-out_infinite]` for a directional shimmer effect.' } },
  },
  argTypes: {
    className: { control: 'text' },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  args: { className: 'h-4 w-[250px]' },
};

export const TextLines: Story = {
  render: () => (
    <div className="flex flex-col gap-3 max-w-sm">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-[90%]" />
      <Skeleton className="h-4 w-[75%]" />
      <Skeleton className="h-4 w-[60%]" />
    </div>
  ),
};

export const CardSkeleton: Story = {
  render: () => (
    <div className="max-w-sm rounded-[2rem] border border-glass-border bg-surface p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-12 w-12 rounded-[2rem]" />
        <div className="flex flex-col gap-2 flex-1">
          <Skeleton className="h-4 w-[60%]" />
          <Skeleton className="h-3 w-[40%]" />
        </div>
      </div>
      <Skeleton className="h-24 w-full rounded-[2rem]" />
    </div>
  ),
};

export const TableRow: Story = {
  render: () => (
    <div className="flex flex-col gap-2 max-w-xl">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 p-3 rounded-[2rem] bg-surface border border-glass-border">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-16 rounded-[2rem]" />
        </div>
      ))}
    </div>
  ),
};

export const Avatar: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <Skeleton className="h-10 w-10 rounded-full" />
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
  ),
};
