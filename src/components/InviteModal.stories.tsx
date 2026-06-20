import type { Meta, StoryObj } from '@storybook/nextjs';
import InviteModal from './InviteModal';
import { withProviders } from '../../.storybook/utils';

const meta: Meta<typeof InviteModal> = {
  title: 'UI/InviteModal',
  component: InviteModal,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Team invitation modal. Role selector (Employee/Accountant), optional business unit dropdown, and 6-digit access code generator with copy functionality.' } },
    viewport: { defaultViewport: 'mobile1' },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof InviteModal>;

export const Default: Story = {
  args: {
    onClose: () => {},
    businessUnits: [
      { id: 'bu-1', name: 'Operations' },
      { id: 'bu-2', name: 'Finance' },
      { id: 'bu-3', name: 'Engineering' },
    ],
  },
};

export const NoBusinessUnits: Story = {
  args: {
    onClose: () => {},
    businessUnits: [],
  },
};

export const ManyBusinessUnits: Story = {
  args: {
    onClose: () => {},
    businessUnits: Array.from({ length: 8 }, (_, i) => ({ id: `bu-${i}`, name: `Department ${i + 1}` })),
  },
};
