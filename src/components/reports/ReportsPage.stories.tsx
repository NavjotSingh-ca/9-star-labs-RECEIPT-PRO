import type { Meta, StoryObj } from '@storybook/nextjs';
import { ReportsPage } from './ReportsPage';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof ReportsPage> = {
  title: 'Reports/ReportsPage',
  component: ReportsPage,
  decorators: [
    withProviders,
    (Story) => (
      <div className="max-w-5xl mx-auto p-4">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: { description: { component: 'Full reports orchestrator page. Shows template library, custom builder, filters, scheduled reports tab, and generated results.' } },
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  args: {
    orgId: 'org-1',
  },
};

export default meta;
type Story = StoryObj<typeof ReportsPage>;

export const Default: Story = {};
