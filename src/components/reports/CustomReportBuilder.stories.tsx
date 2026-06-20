import type { Meta, StoryObj } from '@storybook/nextjs';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fn<T extends (...args: any[]) => any>(_impl?: T): T {
  return ((..._args: any[]) => undefined) as T;
}
import { CustomReportBuilder } from './CustomReportBuilder';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof CustomReportBuilder> = {
  title: 'Reports/CustomReportBuilder',
  component: CustomReportBuilder,
  decorators: [
    withProviders,
    (Story) => (
      <div className="max-w-3xl mx-auto">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: { description: { component: 'Multi-step builder: name, group-by, metrics, date range, generate, and optionally save as template.' } },
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    onClose: fn(),
    orgId: 'org-1',
  },
};

export default meta;
type Story = StoryObj<typeof CustomReportBuilder>;

export const Default: Story = {};
