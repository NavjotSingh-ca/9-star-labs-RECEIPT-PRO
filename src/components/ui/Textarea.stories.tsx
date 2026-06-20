import type { Meta, StoryObj } from '@storybook/nextjs';
import { Textarea } from './textarea';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof Textarea> = {
  title: 'UI/Textarea',
  component: Textarea,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Base UI Textarea with rounded `[2rem]` styling. Supports all native textarea states including disabled and invalid.' } },
  },
  argTypes: {
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    rows: { control: 'number' },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: { placeholder: 'Enter description…' },
};

export const WithValue: Story = {
  args: {
    defaultValue: 'Purchased office supplies for the Q4 team meeting. Total included 3 reams of paper, 2 binders, and assorted stationery.',
  },
};

export const Disabled: Story = {
  args: { placeholder: 'Disabled textarea', disabled: true },
};

export const Invalid: Story = {
  args: {
    placeholder: 'Required field',
    'aria-invalid': 'true' as const,
    defaultValue: '',
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4 max-w-sm">
      <Textarea placeholder="Default textarea" rows={3} />
      <Textarea placeholder="With content" defaultValue="Some longer text content that spans multiple lines.\nThis demonstrates the textarea with actual content." rows={3} />
      <Textarea placeholder="Disabled" disabled rows={3} />
      <Textarea placeholder="Invalid state" aria-invalid="true" rows={3} />
    </div>
  ),
};

export const InCard: Story = {
  render: () => (
    <div className="max-w-sm rounded-[2rem] border border-glass-border bg-surface p-4 shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="story-notes" className="text-xs font-semibold uppercase tracking-wide text-text-muted">Notes</label>
          <Textarea id="story-notes" placeholder="Add notes about this receipt…" rows={4} />
        </div>
      </div>
    </div>
  ),
};
