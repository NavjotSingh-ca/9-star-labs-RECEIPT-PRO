import type { Meta, StoryObj } from '@storybook/nextjs';
import { BulkActionsBar } from './BulkActionsBar';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof BulkActionsBar> = {
  title: 'History/BulkActionsBar',
  component: BulkActionsBar,
  decorators: [withProviders],
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;

export const Default: StoryObj<typeof BulkActionsBar> = {
  args: {
    selectedCount: 5,
    isLoading: false,
    onApprove: () => alert('Approve clicked'),
    onReject: () => alert('Reject clicked'),
    onDelete: () => alert('Delete clicked'),
    onExport: () => alert('Export clicked'),
    onClear: () => alert('Clear clicked'),
  },
  render: (args) => (
    <div className="w-[800px] h-[400px] relative bg-obsidian">
       <BulkActionsBar {...args} />
    </div>
  )
};

export const Loading: StoryObj<typeof BulkActionsBar> = {
  args: {
    ...Default.args,
    isLoading: true,
  },
  render: (args) => (
    <div className="w-[800px] h-[400px] relative bg-obsidian">
       <BulkActionsBar {...args} />
    </div>
  )
};
