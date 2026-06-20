import type { Meta, StoryObj } from '@storybook/nextjs';
import MobileNav from './MobileNav';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof MobileNav> = {
  title: 'Layout/MobileNav',
  component: MobileNav,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Fixed bottom tab navigation with 4 tabs: Home, Records, Scan (center FAB), More. Scan button pulses when no receipts exist.' } },
    viewport: { defaultViewport: 'mobile1' },
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MobileNav>;

export const HomeActive: Story = {
  args: {
    activeTab: 'dashboard',
    onTabChange: () => {},
    role: 'Owner',
    noReceipts: false,
  },
};

export const RecordsActive: Story = {
  args: {
    activeTab: 'receipts',
    onTabChange: () => {},
    role: 'Owner',
    noReceipts: false,
  },
};

export const ScanActive: Story = {
  args: {
    activeTab: 'scan',
    onTabChange: () => {},
    role: 'Owner',
    noReceipts: false,
  },
};

export const MoreActive: Story = {
  args: {
    activeTab: 'more',
    onTabChange: () => {},
    role: 'Owner',
    noReceipts: false,
  },
};

export const NoReceiptsPulse: Story = {
  args: {
    activeTab: 'dashboard',
    onTabChange: () => {},
    role: 'Owner',
    noReceipts: true,
  },
};

export const EmployeeRole: Story = {
  args: {
    activeTab: 'receipts',
    onTabChange: () => {},
    role: 'Employee',
    noReceipts: false,
  },
};
