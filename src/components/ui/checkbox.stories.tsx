import type { Meta, StoryObj } from '@storybook/nextjs';
import { Checkbox } from './checkbox';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof Checkbox> = {
  title: 'UI/Checkbox',
  component: Checkbox,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Radix UI Checkbox primitive with champagne accent styling. Supports checked, indeterminate, disabled, and required states.' } },
  },
  argTypes: {
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    checked: { control: 'boolean' },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  args: { 'aria-label': 'Default checkbox' },
};

export const Checked: Story = {
  args: { checked: true, 'aria-label': 'Checked checkbox' },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2 p-4">
      <Checkbox id="terms" />
      <span className="cursor-pointer">Accept terms and conditions</span>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <Checkbox id="disabled-unchecked" disabled />
        <span className="text-text-muted">Disabled (unchecked)</span>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="disabled-checked" disabled checked />
        <span className="text-text-muted">Disabled (checked)</span>
      </div>
    </div>
  ),
};

export const Group: Story = {
  render: () => (
    <fieldset className="space-y-3 p-4">
      <legend className="text-sm font-semibold text-text-primary mb-2">Notification Preferences</legend>
      <div className="flex items-center gap-2">
        <Checkbox id="notif-email" defaultChecked />
        <span>Email notifications</span>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="notif-sms" />
        <span>SMS notifications</span>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="notif-push" defaultChecked />
        <span>Push notifications</span>
      </div>
    </fieldset>
  ),
};
