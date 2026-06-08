import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Base UI Tabs component with default and line variants. Supports horizontal and vertical orientations.' } },
  },
  argTypes: {
    orientation: { control: 'select', options: ['horizontal', 'vertical'] },
    defaultValue: { control: 'text' },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  args: {
    defaultValue: 'tab1',
    children: (
      <>
        <TabsList>
          <TabsTrigger value="tab1">Overview</TabsTrigger>
          <TabsTrigger value="tab2">Receipts</TabsTrigger>
          <TabsTrigger value="tab3">Export</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1" className="p-4 text-sm text-text-secondary">Overview content goes here.</TabsContent>
        <TabsContent value="tab2" className="p-4 text-sm text-text-secondary">Receipts content goes here.</TabsContent>
        <TabsContent value="tab3" className="p-4 text-sm text-text-secondary">Export content goes here.</TabsContent>
      </>
    ),
  },
};

export const LineVariant: Story = {
  args: {
    defaultValue: 'tab1',
    children: (
      <>
        <TabsList variant="line">
          <TabsTrigger value="tab1">Details</TabsTrigger>
          <TabsTrigger value="tab2">Comments</TabsTrigger>
          <TabsTrigger value="tab3">History</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1" className="p-4 text-sm text-text-secondary">Details panel.</TabsContent>
        <TabsContent value="tab2" className="p-4 text-sm text-text-secondary">Comments panel.</TabsContent>
        <TabsContent value="tab3" className="p-4 text-sm text-text-secondary">History panel.</TabsContent>
      </>
    ),
  },
};

export const Vertical: Story = {
  args: {
    defaultValue: 'tab1',
    orientation: 'vertical',
    className: 'flex-row',
    children: (
      <>
        <TabsList variant="line" className="h-fit min-w-[140px]">
          <TabsTrigger value="tab1">Profile</TabsTrigger>
          <TabsTrigger value="tab2">Billing</TabsTrigger>
          <TabsTrigger value="tab3">Team</TabsTrigger>
        </TabsList>
        <div className="flex-1">
          <TabsContent value="tab1" className="p-4 text-sm text-text-secondary">Profile settings.</TabsContent>
          <TabsContent value="tab2" className="p-4 text-sm text-text-secondary">Billing information.</TabsContent>
          <TabsContent value="tab3" className="p-4 text-sm text-text-secondary">Team management.</TabsContent>
        </div>
      </>
    ),
  },
};
