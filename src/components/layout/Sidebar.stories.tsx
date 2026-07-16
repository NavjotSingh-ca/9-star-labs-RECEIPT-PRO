import type { Meta, StoryObj } from '@storybook/nextjs';
import Sidebar from './Sidebar';
import { withProviders } from '../../../.storybook/utils';
import { useAppStore } from '@/lib/store';

const meta: Meta<typeof Sidebar> = {
  title: 'Layout/Sidebar',
  component: Sidebar,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Dark sidebar (always dark regardless of theme). Collapsible on desktop (256px → 64px). Mobile overlay with hamburger toggle.' } },
    viewport: { defaultViewport: 'desktop' },
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

export const Default: Story = {
  render: () => (
    <div className="h-screen">
      <Sidebar
        activeTab="dashboard"
        onTabChange={() => {}}
        role="Owner"
        planLabel="Pro"
        plan="pro"
        handleSignOut={() => {}}
      />
    </div>
  ),
};

export const Collapsed: Story = {
  render: () => {
    useAppStore.getState().setSidebarCollapsed(true);
    return (
      <div className="h-screen">
        <Sidebar
          activeTab="dashboard"
          onTabChange={() => {}}
          role="Owner"
          planLabel="Pro"
          plan="pro"
          handleSignOut={() => {}}
        />
      </div>
    );
  },
};

export const EmployeeRole: Story = {
  render: () => (
    <div className="h-screen">
      <Sidebar
        activeTab="receipts"
        onTabChange={() => {}}
        role="Employee"
        planLabel="Free"
        plan="free"
        handleSignOut={() => {}}
      />
    </div>
  ),
};

export const AccountantRole: Story = {
  render: () => (
    <div className="h-screen">
      <Sidebar
        activeTab="dashboard"
        onTabChange={() => {}}
        role="Accountant"
        planLabel="Enterprise"
        plan="enterprise"
        handleSignOut={() => {}}
      />
    </div>
  ),
};
