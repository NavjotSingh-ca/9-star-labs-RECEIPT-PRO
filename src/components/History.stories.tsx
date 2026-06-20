import type { Meta, StoryObj } from '@storybook/nextjs';
import History from './History';
import { withProviders } from '../../.storybook/utils';

const meta: Meta<typeof History> = {
  title: 'Page/History',
  component: History,
  decorators: [withProviders],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: 'Main receipts page with tab filters, semantic search, StatCards, infinite-scroll ProfessionalLedger, and Vaul drawer for detail view. Renders empty state when no data is available.' } },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof History>;

export const Empty: Story = {
  args: {
    activeFilter: 'all',
    onUpdate: () => {},
    onScan: () => {},
    role: 'Owner',
    userId: 'user-demo',
  },
};

export const WithPendingFilter: Story = {
  args: {
    ...Empty.args,
    activeFilter: 'review',
  },
};

export const EmployeeView: Story = {
  args: {
    ...Empty.args,
    role: 'Employee',
  },
};
