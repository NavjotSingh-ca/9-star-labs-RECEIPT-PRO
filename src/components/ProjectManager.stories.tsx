import type { Meta, StoryObj } from '@storybook/nextjs';
import ProjectManager from './ProjectManager';
import { withProviders, withQueryData } from '../../.storybook/utils';
import type { Project } from '@/lib/types';

const mockProjects: Project[] = [
  { id: 'proj-1', name: 'Westview Commercial Build', code: 'WCB-01', budget_amount: 500000, status: 'active', user_id: 'user-1', created_at: '2025-01-15T08:00:00Z' },
  { id: 'proj-2', name: 'Maple Ridge Renovation', code: 'MRR-02', budget_amount: 150000, status: 'active', user_id: 'user-1', created_at: '2025-03-01T09:00:00Z' },
];

const mockActuals = [
  { project_id: 'proj-1', total_spent: 325000 },
  { project_id: 'proj-2', total_spent: 185000 },
];

const meta: Meta<typeof ProjectManager> = {
  title: 'Page/ProjectManager',
  component: ProjectManager,
  decorators: [withProviders],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: 'Project CRUD with budget tracking, spend utilization bar, overspend detection, and delete confirmation dialog.' } },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ProjectManager>;

export const Default: Story = {};

export const WithProjects: Story = {
  decorators: [
    withQueryData(['projects'], mockProjects),
    withQueryData(['project_actuals'], mockActuals),
  ],
};

export const OverBudget: Story = {
  decorators: [
    withQueryData(['projects'], [
      { id: 'proj-3', name: 'Over Budget Project', code: 'OB-03', budget_amount: 100000, user_id: 'user-1', created_at: '2025-06-01T08:00:00Z' },
    ]),
    withQueryData(['project_actuals'], [
      { project_id: 'proj-3', total_spent: 125000 },
    ]),
  ],
};

export const NoBudget: Story = {
  decorators: [
    withQueryData(['projects'], [
      { id: 'proj-4', name: 'Unbudgeted Project', code: null, budget_amount: null, user_id: 'user-1', created_at: '2025-06-01T08:00:00Z' },
    ]),
    withQueryData(['project_actuals'], [
      { project_id: 'proj-4', total_spent: 25000 },
    ]),
  ],
};
