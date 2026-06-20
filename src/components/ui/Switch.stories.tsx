import type { Meta, StoryObj } from '@storybook/nextjs';
import React from 'react';
import { Switch } from './switch';
import { Label } from './label';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof Switch> = {
  title: 'UI/Switch',
  component: Switch,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Base UI Switch toggle. Uses `bg-champagne` for checked state. Includes decorative hidden thumb with white fill and shadow.' } },
  },
  argTypes: {
    disabled: { control: 'boolean' },
    defaultChecked: { control: 'boolean' },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {};

export const Checked: Story = {
  args: { defaultChecked: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const DisabledChecked: Story = {
  args: { disabled: true, defaultChecked: true },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4 max-w-sm">
      <div className="flex items-center gap-3">
        <Switch id="off" />
        <Label htmlFor="off">Airplane Mode</Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch id="on" defaultChecked />
        <Label htmlFor="on">Wi-Fi</Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch id="disabled-off" disabled />
        <Label htmlFor="disabled-off" className="text-muted-foreground">Bluetooth (disabled)</Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch id="disabled-on" disabled defaultChecked />
        <Label htmlFor="disabled-on" className="text-muted-foreground">Hotspot (disabled)</Label>
      </div>
    </div>
  ),
};
