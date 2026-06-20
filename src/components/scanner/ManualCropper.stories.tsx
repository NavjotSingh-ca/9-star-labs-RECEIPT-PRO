import type { Meta, StoryObj } from '@storybook/nextjs';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fn<T extends (...args: any[]) => any>(_impl?: T): T {
  return ((..._args: any[]) => undefined) as T;
}
import ManualCropper from './ManualCropper';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof ManualCropper> = {
  title: 'Scanner/ManualCropper',
  component: ManualCropper,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Full-screen drag-to-crop overlay. Uses pointer events for crop rectangle selection.' } },
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  args: {
    imageSrc: 'https://placehold.co/800x600/png',
    fileName: 'receipt-2025-10-01.jpg',
    onCancel: fn(),
    onApply: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof ManualCropper>;

export const Default: Story = {};

export const WithLongFileName: Story = {
  args: {
    fileName: 'receipt-from-costco-wholesale-calgary-ab-october-2025-backside.jpg',
  },
};
