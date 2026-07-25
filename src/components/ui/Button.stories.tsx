import type { Meta, StoryObj } from '@storybook/nextjs';
import { Button } from './button';
import { Plus, Download, Trash2, Settings } from 'lucide-react';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Base UI Button with CVA variants. All styles use the `group/button` pattern for composing child icon animations.' } },
  },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'outline', 'ghost', 'danger', 'success'] },
    size: { control: 'select', options: ['sm', 'md', 'lg', 'icon'] },
    disabled: { control: 'boolean' },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: { children: 'Button', variant: 'primary', size: 'md' },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="success">Success</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">sm</Button>
      <Button size="md">md</Button>
      <Button size="lg">lg</Button>
      <Button size="icon" aria-label="Settings"><Settings className="size-4" /></Button>
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button><Plus className="size-4" /> Add Item</Button>
      <Button variant="outline"><Download className="size-4" /> Download</Button>
      <Button variant="danger"><Trash2 className="size-4" /> Delete</Button>
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button loading>Saving…</Button>
      <Button variant="outline" loading>Loading…</Button>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button disabled>Disabled</Button>
      <Button variant="outline" disabled>Disabled</Button>
      <Button variant="danger" disabled>Disabled</Button>
    </div>
  ),
};

export const AsChildExample: Story = {
  parameters: { docs: { description: { story: 'Use the Base UI `render` prop to render as a different element.' } } },
  render: () => (
    <a href="https://example.com" className="inline-flex items-center justify-center font-semibold rounded-xl h-10 px-4 text-sm bg-champagne text-obsidian hover:bg-champagne-dim">
      Link Button
    </a>
  ),
};
