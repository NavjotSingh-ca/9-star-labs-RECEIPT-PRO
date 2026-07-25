import type { Meta, StoryObj } from '@storybook/nextjs';
import { CommandPalette } from './CommandPalette';
import { withProviders } from '../../.storybook/utils';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Command } from 'lucide-react';

const meta: Meta<typeof CommandPalette> = {
  title: 'UI/CommandPalette',
  component: CommandPalette,
  decorators: [withProviders],
  parameters: {
    docs: {
      description: {
        component:
          'Cmd+K / Ctrl+K command palette. Fuzzy search across navigation, settings pages, and quick actions (theme toggle, sign out). Spring-animated modal with backdrop blur and champagne accents.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CommandPalette>;

export const Default: Story = {
  args: {
    isOpen: false,
    onClose: () => {},
    onCommand: (cmd) => console.log('Command:', cmd.label),
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
        {open && (
          <CommandPalette
            isOpen={true}
            onClose={() => setOpen(false)}
            onCommand={(cmd) => console.log(cmd.label)}
          />
        )}
      </div>
    );
  },
};
