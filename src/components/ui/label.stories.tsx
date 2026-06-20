import type { Meta, StoryObj } from '@storybook/nextjs';
import React from 'react';
import { Label } from './label';
import { Input } from './input';
import { Switch } from './switch';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof Label> = {
  title: 'UI/Label',
  component: Label,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Radix UI Label primitive with peer-disabled styling. Use with form controls for accessible labels.' } },
  },
  argTypes: {
    htmlFor: { control: 'text' },
    children: { control: 'text' },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  args: {
    htmlFor: 'story-email',
    children: 'Email address',
  },
};

export const WithInput: Story = {
  render: () => (
    <div className="flex flex-col gap-2 max-w-sm">
      <Label htmlFor="story-input">Email</Label>
      <Input id="story-input" type="email" placeholder="you@example.com" />
    </div>
  ),
};

export const WithSwitch: Story = {
  render: () => (
    <div className="flex items-center gap-3 max-w-sm">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Airplane Mode</Label>
    </div>
  ),
};

export const DisabledPeer: Story = {
  render: () => (
    <div className="flex items-center gap-3 max-w-sm">
      <Switch id="disabled-switch" disabled />
      <Label htmlFor="disabled-switch" className="text-muted-foreground">Disabled option</Label>
    </div>
  ),
};

export const WithRequired: Story = {
  render: () => (
    <div className="flex flex-col gap-2 max-w-sm">
      <Label htmlFor="story-required">
        Full name <span className="text-danger">*</span>
      </Label>
      <Input id="story-required" placeholder="John Smith" required />
    </div>
  ),
};
