import type { Meta, StoryObj } from '@storybook/nextjs';
function fn<T extends (...args: any[]) => any>(_impl?: T): T {
  return ((..._args: any[]) => undefined) as T;
}
import CaptureControls from './CaptureControls';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof CaptureControls> = {
  title: 'Scanner/CaptureControls',
  component: CaptureControls,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Three capture method options: Camera, Upload, Screenshot. Shows batch limit info when > 1.' } },
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onCameraClick: fn(),
    onUploadClick: fn(),
    onScreenshotClick: fn(),
    batchLimit: 10,
    maxDimension: 2048,
  },
};

export default meta;
type Story = StoryObj<typeof CaptureControls>;

export const Default: Story = {};

export const SingleMode: Story = {
  args: { batchLimit: 1 },
  parameters: { docs: { description: { story: 'Batch mode hint hidden when limit is 1.' } } },
};

export const HighLimit: Story = {
  args: { batchLimit: 50 },
};
