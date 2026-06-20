import type { Meta, StoryObj } from '@storybook/nextjs';
import CommandPalette from './CommandPalette';
import { withProviders } from '../../.storybook/utils';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Command } from 'lucide-react';

const meta: Meta<typeof CommandPalette> = {
  title: 'UI/CommandPalette',
  component: CommandPalette,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Cmd+K / Ctrl+K command palette. Searchable list of actions: scan, bulk upload, missing BN queue, export, toggle role. Spring-animated modal with backdrop blur.' } },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CommandPalette>;

export const Default: Story = {
  args: {
    onAction: (action: string) => console.log('Action:', action),
  },
};

export const Open: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div className="p-8">
        <Button onClick={() => setOpen(!open)}>
          <Command className="size-4 mr-2" />
          {open ? 'Close' : 'Open'} Command Palette
        </Button>
        {open && <CommandPalette onAction={(a) => { console.log(a); setOpen(false); }} />}
      </div>
    );
  },
};
