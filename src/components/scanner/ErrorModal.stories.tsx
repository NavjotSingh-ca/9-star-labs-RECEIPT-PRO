import type { Meta, StoryObj } from '@storybook/nextjs';
function fn<T extends (...args: any[]) => any>(_impl?: T): T {
  return ((..._args: any[]) => undefined) as T;
}
import ErrorModal from './ErrorModal';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof ErrorModal> = {
  title: 'Scanner/ErrorModal',
  component: ErrorModal,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Modal with error message in a monospace block. Used for DB integrity errors and API failures.' } },
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    message: 'duplicate key value violates unique constraint "receipts_integrity_hash_key"',
    onDismiss: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof ErrorModal>;

export const Default: Story = {};

export const LongError: Story = {
  args: {
    message: 'User does not have permission to insert into table "receipts". Make sure you are logged in and have the correct role. If using RLS, verify your policies are working correctly. Error code: 42501.',
  },
};
