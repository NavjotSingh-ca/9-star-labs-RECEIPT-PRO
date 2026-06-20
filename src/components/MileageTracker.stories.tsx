import type { Meta, StoryObj } from '@storybook/nextjs';
import MileageTracker from './MileageTracker';
import { withProviders, withQueryData } from '../../.storybook/utils';

const mockVehicles = [
  { id: 'v1', nickname: 'Work Truck', plate: 'ABC-123', make: 'Ford', model: 'F-150', year: 2024, created_at: '2025-01-01', org_id: 'org-1', user_id: 'user-1' },
  { id: 'v2', nickname: 'Daily Car', plate: 'XYZ-789', make: 'Toyota', model: 'Camry', year: 2023, created_at: '2025-01-15', org_id: 'org-1', user_id: 'user-1' },
];

const mockLogs = [
  { id: 'l1', trip_date: '2025-10-01', purpose: 'Client meeting at Leduc site', start_location: '123 Main St', end_location: '456 Oak Ave', distance_km: 45.5, total_amount: 31.85, rate_per_km: 0.70, vehicle_id: 'v1', notes: '', created_at: '2025-10-01T10:00:00Z', user_id: 'user-1', org_id: 'org-1' },
  { id: 'l2', trip_date: '2025-10-03', purpose: 'Supply run - Home Depot', start_location: 'Office', end_location: 'Home Depot South', distance_km: 12.3, total_amount: 8.61, rate_per_km: 0.70, vehicle_id: 'v2', notes: '', created_at: '2025-10-03T14:00:00Z', user_id: 'user-1', org_id: 'org-1' },
  { id: 'l3', trip_date: '2025-10-05', purpose: 'Equipment pickup', start_location: 'Warehouse', end_location: 'Supplier Co', distance_km: 78.2, total_amount: 54.74, rate_per_km: 0.70, vehicle_id: 'v1', notes: '', created_at: '2025-10-05T09:00:00Z', user_id: 'user-1', org_id: 'org-1' },
];

const meta: Meta<typeof MileageTracker> = {
  title: 'Page/MileageTracker',
  component: MileageTracker,
  decorators: [withProviders],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: 'Vehicle CRUD, trip logging with CRA rate preview, summary cards (total km, deduction, trip count), and CRA rate info banner.' } },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MileageTracker>;

export const Default: Story = {};

export const WithData: Story = {
  decorators: [
    withQueryData(['vehicles'], mockVehicles),
  ],
};

export const WithTrips: Story = {
  decorators: [
    withQueryData(['vehicles'], mockVehicles),
    withQueryData(['mileage_logs'], mockLogs),
  ],
};
