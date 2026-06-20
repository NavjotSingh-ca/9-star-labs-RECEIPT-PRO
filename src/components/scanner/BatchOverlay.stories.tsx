import type { Meta, StoryObj } from '@storybook/nextjs';
import BatchOverlay from './BatchOverlay';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof BatchOverlay> = {
  title: 'Scanner/BatchOverlay',
  component: BatchOverlay,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Progress bar for batch processing. Shows champagne gradient during normal operation, danger styling on errors.' } },
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof BatchOverlay>;

export const InProgress: Story = {
  args: { progress: 3, total: 10, failedItems: 0 },
};

export const Halfway: Story = {
  args: { progress: 5, total: 10 },
};

export const AlmostDone: Story = {
  args: { progress: 9, total: 10 },
};

export const Complete: Story = {
  args: { progress: 10, total: 10 },
};

export const WithError: Story = {
  args: { progress: 4, total: 10, error: 'Failed to analyze receipt-4.jpg: OCR timeout', failedItems: 1 },
};

export const WithErrorsOnly: Story = {
  args: { progress: 0, total: 5, error: 'Batch processing failed', failedItems: 5 },
};

export const SingleItem: Story = {
  args: { progress: 1, total: 1 },
};
