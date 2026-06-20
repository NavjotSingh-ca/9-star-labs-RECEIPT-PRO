import type { Meta, StoryObj } from '@storybook/nextjs';
import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof Avatar> = {
  title: 'UI/Avatar',
  component: Avatar,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Base UI Avatar with image and fallback. Supports sm (32px), md (40px), and lg (64px) sizes. Fallback shows initials on champagne/10 background.' } },
  },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const WithImage: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar size="sm">
        <AvatarImage alt="User" src="https://i.pravatar.cc/40?img=1" />
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
      <Avatar size="md">
        <AvatarImage alt="User" src="https://i.pravatar.cc/40?img=2" />
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarImage alt="User" src="https://i.pravatar.cc/64?img=3" />
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
    </div>
  ),
};

export const WithFallback: Story = {
  args: {
    size: "md",
  },
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar size="sm">
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
      <Avatar size="md">
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    </div>
  ),
};

export const BrokenImage: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar size="md">
        <AvatarImage alt="Broken" src="https://nonexistent.example.com/avatar.jpg" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
      <Avatar size="md">
        <AvatarImage alt="Also broken" src="https://invalid.url/img.png" />
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      <div className="flex flex-col items-center gap-2">
        <Avatar size="sm">
          <AvatarFallback>S</AvatarFallback>
        </Avatar>
        <span className="text-xs text-text-muted">sm</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Avatar size="md">
          <AvatarFallback>M</AvatarFallback>
        </Avatar>
        <span className="text-xs text-text-muted">md</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Avatar size="lg">
          <AvatarFallback>L</AvatarFallback>
        </Avatar>
        <span className="text-xs text-text-muted">lg</span>
      </div>
    </div>
  ),
};
