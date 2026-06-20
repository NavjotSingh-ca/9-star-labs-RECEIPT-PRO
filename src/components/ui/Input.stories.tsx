import type { Meta, StoryObj } from '@storybook/nextjs';
import { Input } from './input';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Base UI Input with rounded `[2rem]` styling. Supports all native input states including disabled, invalid, and placeholder.' } },
  },
  argTypes: {
    type: { control: 'select', options: ['text', 'email', 'password', 'number', 'date', 'search', 'url'] },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: { placeholder: 'Enter value…', type: 'text' },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4 max-w-sm">
      <Input placeholder="Default input" />
      <Input placeholder="With value" defaultValue="Some text value" />
      <Input placeholder="Disabled" disabled />
      <Input
        placeholder="Invalid state"
        aria-invalid="true"
        defaultValue="bad@"
      />
      <Input placeholder="Search…" type="search" />
      <Input type="date" defaultValue="2025-06-07" />
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-2 max-w-sm">
      <label htmlFor="story-email" className="text-sm font-medium text-text-primary">Email</label>
      <Input id="story-email" type="email" placeholder="you@example.com" />
    </div>
  ),
};

export const InCard: Story = {
  render: () => (
    <div className="max-w-sm rounded-[2rem] border border-glass-border bg-surface p-4 shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="story-name" className="text-xs font-semibold uppercase tracking-wide text-text-muted">Name</label>
          <Input id="story-name" placeholder="Business name" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="story-amount" className="text-xs font-semibold uppercase tracking-wide text-text-muted">Amount</label>
          <Input id="story-amount" type="number" placeholder="0.00" />
        </div>
      </div>
    </div>
  ),
};
