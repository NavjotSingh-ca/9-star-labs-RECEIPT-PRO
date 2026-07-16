import type { Meta, StoryObj } from '@storybook/nextjs';
function fn<T extends (...args: any[]) => any>(_impl?: T): T {
  return ((..._args: any[]) => undefined) as T;
}
import BlurWarning from './BlurWarning';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof BlurWarning> = {
  title: 'Scanner/BlurWarning',
  component: BlurWarning,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Amber warning card when image blur score exceeds threshold. Offers retake or use-anyway actions.' } },
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    blurScore: 35,
    onRetake: fn(),
    onUseAnyway: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof BlurWarning>;

export const Default: Story = {};

export const VeryBlurry: Story = {
  args: { blurScore: 12 },
};

export const Borderline: Story = {
  args: { blurScore: 55 },
};

export const NullScore: Story = {
  args: { blurScore: null },
  parameters: { docs: { description: { story: 'Null score — displays 0 as fallback.' } } },
};
