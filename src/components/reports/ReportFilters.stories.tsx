import type { Meta, StoryObj } from '@storybook/nextjs';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fn<T extends (...args: any[]) => any>(_impl?: T): T {
  return ((..._args: any[]) => undefined) as T;
}
import { ReportFilters } from './ReportFilters';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof ReportFilters> = {
  title: 'Reports/ReportFilters',
  component: ReportFilters,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Date filter presets (This Month, Last Quarter, etc.) with custom range support. Shows date inputs when Custom is selected.' } },
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    onChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof ReportFilters>;

export const Default: Story = {};

export const CustomRangeSelected: Story = {
  parameters: {
    docs: { description: { story: 'Click "Custom Range" to reveal date inputs.' } },
  },
};
