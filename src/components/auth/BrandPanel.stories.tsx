import type { Meta, StoryObj } from '@storybook/nextjs';
import BrandPanel from './BrandPanel';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof BrandPanel> = {
  title: 'Auth/BrandPanel',
  component: BrandPanel,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Left-side brand panel for the auth split-screen layout. Shows app logo, headline with champagne gradient, feature highlights (SHA-256, AI-powered, CRA-Ready), and copyright.' } },
    viewport: { defaultViewport: 'desktop' },
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof BrandPanel>;

export const Default: Story = {};

export const MobileHidden: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
