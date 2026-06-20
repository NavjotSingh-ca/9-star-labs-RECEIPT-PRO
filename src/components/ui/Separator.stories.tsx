import type { Meta, StoryObj } from '@storybook/nextjs';
import { Separator } from './separator';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof Separator> = {
  title: 'UI/Separator',
  component: Separator,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Base UI Separator with support for horizontal and vertical orientations. Uses `bg-border` for the line color.' } },
  },
  argTypes: {
    orientation: { control: 'select', options: ['horizontal', 'vertical'] },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  args: { orientation: 'horizontal', className: 'my-4' },
};

export const Vertical: Story = {
  decorators: [
    (Story) => (
      <div className="flex h-16 items-center gap-4">
        <span>Left</span>
        <Story />
        <span>Right</span>
      </div>
    ),
  ],
  args: { orientation: 'vertical', className: 'mx-2' },
};

export const InContext: Story = {
  render: () => (
    <div className="max-w-sm rounded-[2rem] border border-glass-border bg-surface p-4 shadow-sm">
      <div className="space-y-2">
        <div className="text-sm font-medium">Section 1</div>
        <div className="text-sm text-muted-foreground">Content for the first section.</div>
      </div>
      <Separator className="my-4" />
      <div className="space-y-2">
        <div className="text-sm font-medium">Section 2</div>
        <div className="text-sm text-muted-foreground">Content for the second section.</div>
      </div>
    </div>
  ),
};

export const WithVerticalDividers: Story = {
  render: () => (
    <div className="flex items-center gap-3 text-sm">
      <span>New</span>
      <Separator orientation="vertical" className="h-4" />
      <span>Popular</span>
      <Separator orientation="vertical" className="h-4" />
      <span>Trending</span>
    </div>
  ),
};
