import type { Meta, StoryObj } from '@storybook/nextjs';
import { OnboardingTour } from './OnboardingTour';
import { withProviders } from '../../.storybook/utils';

const meta: Meta<typeof OnboardingTour> = {
  title: 'UI/OnboardingTour',
  component: OnboardingTour,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'React Joyride onboarding tour with 3 steps (scan, dashboard, review). Shown once on first login.' } },
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof OnboardingTour>;

export const Default: Story = {};

export const WithTargets: Story = {
  decorators: [
    (Story) => (
      <div>
        <button id="scan-fab" className="m-4 px-4 py-2 bg-champagne rounded-full text-black text-sm font-bold">Scan</button>
        <div id="dashboard-kpis" className="m-4 p-4 bg-surface-raised rounded-xl border border-glass-border">KPI cards</div>
        <div id="main-content" className="m-4 p-4 bg-surface-raised rounded-xl border border-glass-border">Receipt list</div>
        <Story />
      </div>
    ),
  ],
  parameters: { docs: { description: { story: 'Renders with target DOM elements present so the tour has anchors.' } } },
};
