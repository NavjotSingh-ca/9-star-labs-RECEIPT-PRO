import type { Meta, StoryObj } from '@storybook/nextjs';
import Dashboard from './Dashboard';
import { withProviders } from '../../.storybook/utils';

const meta: Meta<typeof Dashboard> = {
  title: 'Dashboard/Full',
  component: Dashboard,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Main dashboard with KPI hero metric, secondary stats, daily spend chart, category donut, GST recovery meter, and alert tiles. Shows loading skeleton, error, empty, or employee-restricted states.' } },
    viewport: { defaultViewport: 'desktop' },
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Dashboard>;

export const Loading: Story = {
  args: {
    onScan: () => {},
    role: 'Owner',
    userId: undefined,
  },
};

export const EmployeeView: Story = {
  args: {
    role: 'Employee',
    userId: 'user-demo',
  },
};
