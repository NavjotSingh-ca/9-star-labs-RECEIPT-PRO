import type { Meta, StoryObj } from '@storybook/nextjs';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fn<T extends (...args: any[]) => any>(_impl?: T): T {
  return ((..._args: any[]) => undefined) as T;
}
import ImagePreview from './ImagePreview';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof ImagePreview> = {
  title: 'Scanner/ImagePreview',
  component: ImagePreview,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Image preview card with crop/reset actions and AI analysis CTA. Transitions to split layout after analysis.' } },
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    imageSrc: 'https://placehold.co/800x600/png',
    originalFileName: 'receipt-2025-10-01.jpg',
    fileName: 'receipt-2025-10-01.jpg',
    processingAI: false,
    hasAnalyzed: false,
    canProcess: true,
    onCrop: fn(),
    onReset: fn(),
    onProcessAI: fn(),
    formContent: null,
  },
};

export default meta;
type Story = StoryObj<typeof ImagePreview>;

export const Default: Story = {};

export const Processing: Story = {
  args: { processingAI: true, canProcess: false },
  parameters: { docs: { description: { story: 'AI analysis in progress — shimmer bar and pulsing overlay.' } } },
};

export const CannotProcess: Story = {
  args: { canProcess: false },
};

export const Analyzed: Story = {
  args: {
    hasAnalyzed: true,
    formContent: (
      <div className="rounded-lg border border-glass-border bg-card p-6 text-center text-sm text-text-muted">
        ScannerForm would render here after AI analysis.
      </div>
    ),
  },
};

export const LongFileName: Story = {
  args: {
    originalFileName: 'receipt-from-shell-station-calgary-ab-2025-10-01-back-receipt-copy.jpg',
  },
};
