import type { Meta, StoryObj } from '@storybook/nextjs';
import { UpgradePrompt } from './upgrade-prompt';
import { withProviders } from '../../.storybook/utils';

const meta: Meta<typeof UpgradePrompt> = {
  title: 'UI/UpgradePrompt',
  component: UpgradePrompt,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Plan limit warnings: receipt limit reached, low on receipts, user limit reached, trial ending.' } },
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof UpgradePrompt>;

export const ReceiptLimitReached: Story = {
  args: { plan: 'free', receiptCount: 25, teamSize: 1 },
  parameters: { docs: { description: { story: 'Free plan — 25/25 receipts used. Shows red block alert.' } } },
};

export const LowOnReceipts: Story = {
  args: { plan: 'free', receiptCount: 22, teamSize: 1 },
  parameters: { docs: { description: { story: 'Free plan — 22/25 receipts used. Shows amber warning (≤5 remaining).' } } },
};

export const UserLimitReached: Story = {
  args: { plan: 'free', receiptCount: 5, teamSize: 1 },
  parameters: { docs: { description: { story: 'Free plan — 1/1 user used. Shows user limit warning.' } } },
};

export const TrialEnding: Story = {
  args: { plan: 'free', receiptCount: 0, teamSize: 1, isTrialing: true, daysLeftInTrial: 2 },
  parameters: { docs: { description: { story: 'Trial has 2 days left. Shows champagne trial-ending banner.' } } },
};

export const NoWarnings: Story = {
  args: { plan: 'pro', receiptCount: 10, teamSize: 3 },
  parameters: { docs: { description: { story: 'Pro plan with unlimited receipts and spare users — nothing shown.' } } },
};
