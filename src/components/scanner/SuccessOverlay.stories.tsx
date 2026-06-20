import type { Meta, StoryObj } from '@storybook/nextjs';
import SuccessOverlay from './SuccessOverlay';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof SuccessOverlay> = {
  title: 'Scanner/SuccessOverlay',
  component: SuccessOverlay,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Full-screen success animation overlay with checkmark. Visible state only; hidden when `visible` is false.' } },
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SuccessOverlay>;

export const Visible: Story = {
  args: { visible: true },
};

export const Hidden: Story = {
  args: { visible: false },
  parameters: { docs: { description: { story: 'Returns null — nothing rendered.' } } },
};
