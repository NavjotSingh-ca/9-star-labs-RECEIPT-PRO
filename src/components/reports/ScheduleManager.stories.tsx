import type { Meta, StoryObj } from '@storybook/nextjs';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fn<T extends (...args: any[]) => any>(_impl?: T): T {
  return ((..._args: any[]) => undefined) as T;
}
import { ScheduleManager } from './ScheduleManager';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof ScheduleManager> = {
  title: 'Reports/ScheduleManager',
  component: ScheduleManager,
  decorators: [
    (Story) => {
      // Mock the hooks that ScheduleManager uses internally
      // We rely on the QueryClientProvider from withProviders
      return withProviders(Story);
    },
    (Story) => (
      <div className="max-w-2xl mx-auto">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: { description: { component: 'CRUD for scheduled report delivery. Lists active/paused schedules with toggle and delete. "New Schedule" opens a dialog with frequency, email, format options.' } },
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    orgId: 'org-1',
  },
};

export default meta;
type Story = StoryObj<typeof ScheduleManager>;

export const Default: Story = {};
