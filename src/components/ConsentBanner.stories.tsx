import type { Meta, StoryObj } from '@storybook/nextjs';
import { ConsentBanner } from './ConsentBanner';
import { withProviders } from '../../.storybook/utils';

const meta: Meta<typeof ConsentBanner> = {
  title: 'UI/ConsentBanner',
  component: ConsentBanner,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Privacy & data processing consent banner. Shown on first login. Discloses AI processing (Google Gemini), US-based servers, and data retention policy. Consent stored in localStorage.' } },
    viewport: { defaultViewport: 'mobile1' },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ConsentBanner>;

export const Default: Story = {};
