import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from './dropdown-menu';
import { Button } from './button';
import { withProviders } from '../../../.storybook/utils';
import { Settings, User, LogOut, CreditCard, ChevronRight } from 'lucide-react';

const meta: Meta<typeof DropdownMenu> = {
  title: 'UI/DropdownMenu',
  component: DropdownMenu,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Base UI Menu powered dropdown with items, separators, labels, checkboxes, radio groups, and submenus.' } },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DropdownMenu>;

export const Default: Story = {
  render: () => (
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger render={<Button variant="outline">Open Menu</Button>} />
      <DropdownMenuContent className="w-48">
        <DropdownMenuItem>
          <User className="size-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="size-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem>
          <CreditCard className="size-4" />
          Billing
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut className="size-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

export const WithCheckboxes: Story = {
  render: () => (
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger render={<Button variant="outline">Columns</Button>} />
      <DropdownMenuContent className="w-48">
        <DropdownMenuLabel>Visible Columns</DropdownMenuLabel>
        <DropdownMenuCheckboxItem defaultChecked>Vendor</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem defaultChecked>Amount</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem defaultChecked>Date</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem>Category</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem>Tax</DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

export const WithSubmenu: Story = {
  render: () => (
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger render={<Button variant="outline">More Actions</Button>} />
      <DropdownMenuContent className="w-48">
        <DropdownMenuItem>View Details</DropdownMenuItem>
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            Export As <ChevronRight className="size-3.5 ml-auto" />
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>CSV</DropdownMenuItem>
            <DropdownMenuItem>PDF</DropdownMenuItem>
            <DropdownMenuItem>ZIP Package</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};
