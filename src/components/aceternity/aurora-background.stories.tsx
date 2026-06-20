import type { Meta, StoryObj } from '@storybook/nextjs';
import { AuroraBackground } from './aurora-background';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof AuroraBackground> = {
  title: 'Aceternity/AuroraBackground',
  component: AuroraBackground,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Animated aurora gradient background with champagne-tinted dark variant. Used on auth pages.' } },
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AuroraBackground>;

export const Default: Story = {
  args: {
    children: (
      <div className="text-center z-10">
        <h1 className="text-3xl font-bold text-white mb-2">Aurora Background</h1>
        <p className="text-white/60">Animated gradient with champagne tones</p>
      </div>
    ),
  },
};

export const WithoutRadialGradient: Story = {
  args: {
    showRadialGradient: false,
    children: (
      <div className="text-center z-10">
        <p className="text-white/80 text-sm">Radial gradient mask disabled</p>
      </div>
    ),
  },
};
