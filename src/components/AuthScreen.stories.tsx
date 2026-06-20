import type { Meta, StoryObj } from '@storybook/nextjs';
import AuthScreen from './AuthScreen';
import { withProviders } from '../../.storybook/utils';

const meta: Meta<typeof AuthScreen> = {
  title: 'Auth/AuthScreen',
  component: AuthScreen,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Full-screen auth page with split layout. Desktop: BrandPanel (left) + AuthForm (right). Mobile: stacked with centered form. Animated gradient background with floating orbs.' } },
    viewport: { defaultViewport: 'desktop' },
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AuthScreen>;

export const Default: Story = {};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};

export const Tablet: Story = {
  parameters: { viewport: { defaultViewport: 'tablet' } },
};
