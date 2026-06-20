import type { Meta, StoryObj } from '@storybook/nextjs';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fn<T extends (...args: any[]) => any>(_impl?: T): T {
  return ((..._args: any[]) => undefined) as T;
}
import { EliteUpload } from './EliteUpload';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof EliteUpload> = {
  title: 'Scanner/EliteUpload',
  component: EliteUpload,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Drag-and-drop upload zone with camera CTA. Uses react-dropzone. Shows processing state after file selection.' } },
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    onFileSelect: fn(),
    onCameraClick: fn(),
    isProcessing: false,
  },
};

export default meta;
type Story = StoryObj<typeof EliteUpload>;

export const Default: Story = {};

export const Processing: Story = {
  args: { isProcessing: true },
  parameters: { docs: { description: { story: 'Shows "Gemini AI is reading your receipt..." status bar below upload zone.' } } },
};
