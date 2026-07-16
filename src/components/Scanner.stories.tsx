import type { Meta, StoryObj } from '@storybook/nextjs';
function fn<T extends (...args: any[]) => any>(_impl?: T): T {
  return ((..._args: any[]) => undefined) as T;
}
import Scanner from './Scanner';
import { withProviders } from '../../.storybook/utils';

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2025-01-01T00:00:00Z',
} as unknown as import('@supabase/supabase-js').User;

const meta: Meta<typeof Scanner> = {
  title: 'Scanner/Scanner',
  component: Scanner,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Thin orchestrator for the scanner flow. Delegates state to useScannerState hook and renders sub-components.' } },
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    user: mockUser,
    onSaveSuccess: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof Scanner>;

export const Default: Story = {};

export const NoUser: Story = {
  args: {
    user: null,
    onSaveSuccess: fn(),
  },
  parameters: { docs: { description: { story: 'Null user — scanner renders with empty state but still functional.' } } },
};
