import type { Meta, StoryObj } from '@storybook/nextjs';
import { Badge } from './badge';
import { Check, X, AlertTriangle } from 'lucide-react';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Badge component using Base UI `useRender` and CVA. Designed for labels, status indicators, and counts.' } },
  },
  argTypes: {
    variant: { control: 'select', options: ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'] },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: { children: 'Badge', variant: 'default' },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2 items-center">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="ghost">Ghost</Badge>
      <Badge variant="link">Link</Badge>
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2 items-center">
      <Badge variant="default"><Check className="size-3" /> Active</Badge>
      <Badge variant="destructive"><X className="size-3" /> Blocked</Badge>
      <Badge variant="outline"><AlertTriangle className="size-3" /> Warning</Badge>
    </div>
  ),
};

export const StatusSimulation: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2 items-center">
      <Badge variant="default">Approved</Badge>
      <Badge variant="secondary">Pending</Badge>
      <Badge variant="destructive">Flagged</Badge>
      <Badge variant="outline">Draft</Badge>
    </div>
  ),
};
