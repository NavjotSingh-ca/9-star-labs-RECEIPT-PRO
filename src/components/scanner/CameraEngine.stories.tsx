import type { Meta, StoryObj } from '@storybook/nextjs';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fn<T extends (...args: any[]) => any>(_impl?: T): T {
  return ((..._args: any[]) => undefined) as T;
}
import CameraEngine from './CameraEngine';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof CameraEngine> = {
  title: 'Scanner/CameraEngine',
  component: CameraEngine,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Full-screen camera overlay using getUserMedia. Captures a photo and passes the File to onCapture.' } },
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  args: {
    onCapture: fn(),
    onClose: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof CameraEngine>;

export const Default: Story = {};

export const MobileViewport: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile2' },
  },
};
