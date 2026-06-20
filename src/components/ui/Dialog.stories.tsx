import type { Meta, StoryObj } from '@storybook/nextjs';
import React from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from './dialog';
import { Button } from './button';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof Dialog> = {
  title: 'UI/Dialog',
  component: Dialog,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Base UI Dialog modal with overlay, close button, header, footer, title, and description slots.' } },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Dialog>;

export const Default: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger render={<Button>Open Dialog</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Receipt</DialogTitle>
          <DialogDescription>Update the details for this receipt below.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-secondary">Vendor</label>
            <input className="h-8 w-full rounded-[2rem] border border-glass-border bg-surface-raised px-3 text-sm outline-none focus:border-champagne/40" defaultValue="Amazon" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-secondary">Amount</label>
            <input className="h-8 w-full rounded-[2rem] border border-glass-border bg-surface-raised px-3 text-sm outline-none focus:border-champagne/40" type="number" defaultValue="124.50" />
          </div>
        </div>
        <DialogFooter showCloseButton>
          <Button>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const WithoutCloseButton: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger render={<Button variant="outline">Simple Dialog</Button>} />
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Notice</DialogTitle>
          <DialogDescription>This dialog has no close button — must be dismissed via action.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button>Got it</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
