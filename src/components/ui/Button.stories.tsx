import type { Meta, StoryObj } from '@storybook/nextjs';
import { Button } from './button';
import { Plus, Download, Trash2, Settings, ArrowRight, Loader2 } from 'lucide-react';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Base UI Button with CVA variants. All styles use the `group/button` pattern for composing child icon animations.' } },
  },
  argTypes: {
    variant: { control: 'select', options: ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'] },
    size: { control: 'select', options: ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'] },
    disabled: { control: 'boolean' },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: { children: 'Button', variant: 'default', size: 'default' },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button variant="default">Default</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="xs">xs</Button>
      <Button size="sm">sm</Button>
      <Button size="default">default</Button>
      <Button size="lg">lg</Button>
      <Button size="icon" aria-label="Settings"><Settings className="size-4" /></Button>
      <Button size="icon-xs" aria-label="Add"><Plus className="size-3" /></Button>
      <Button size="icon-sm" aria-label="Download"><Download className="size-3.5" /></Button>
      <Button size="icon-lg" aria-label="Next"><ArrowRight className="size-4" /></Button>
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button><Plus className="size-4" /> Add Item</Button>
      <Button variant="outline"><Download className="size-4" /> Download</Button>
      <Button variant="destructive"><Trash2 className="size-4" /> Delete</Button>
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button disabled><Loader2 className="size-4 animate-spin" /> Saving…</Button>
      <Button variant="outline" disabled><Loader2 className="size-4 animate-spin" /> Loading…</Button>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button disabled>Disabled</Button>
      <Button variant="outline" disabled>Disabled</Button>
      <Button variant="destructive" disabled>Disabled</Button>
    </div>
  ),
};

export const AsChildExample: Story = {
  parameters: { docs: { description: { story: 'Use the Base UI `render` prop to render as a different element.' } } },
  render: () => (
    <Button render={<a href="https://example.com" />}>Link Button</Button>
  ),
};
