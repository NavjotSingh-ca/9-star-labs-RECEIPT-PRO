import type { Meta, StoryObj } from '@storybook/nextjs';
import { ThemeToggle } from './ThemeToggle';
import { withProviders } from '../../.storybook/utils';

const meta: Meta<typeof ThemeToggle> = {
  title: 'UI/ThemeToggle',
  component: ThemeToggle,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Animated Sun/Moon toggle button. Switches between light and dark theme. Defaults to system preference. Shows skeleton placeholder until mounted.' } },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ThemeToggle>;

export const Default: Story = {
  render: () => (
    <div className="bg-obsidian p-6 rounded-2xl inline-block">
      <ThemeToggle />
    </div>
  ),
};
