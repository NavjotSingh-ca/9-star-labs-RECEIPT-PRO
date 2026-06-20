import type { Meta, StoryObj } from '@storybook/nextjs';
import AnimatedCounter from './AnimatedCounter';
import { withProviders } from '../../../.storybook/utils';
import { Card, CardContent, CardHeader, CardTitle } from './card';

const meta: Meta<typeof AnimatedCounter> = {
  title: 'UI/AnimatedCounter',
  component: AnimatedCounter,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Spring-animated number counter using Framer Motion. Good for KPI metrics and dashboard stats. Animates from `from` to `to` with configurable delay.' } },
  },
  argTypes: {
    from: { control: 'number' },
    to: { control: 'number', required: true },
    delay: { control: 'number' },
    className: { control: 'text' },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AnimatedCounter>;

export const Default: Story = {
  args: { from: 0, to: 12450 },
};

export const Currency: Story = {
  args: {
    from: 0,
    to: 12450.50,
    format: (v) => `$${v.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    className: 'text-4xl font-bold tabular-nums tracking-tight text-champagne',
  },
};

export const Integer: Story = {
  args: { from: 0, to: 42, className: 'text-4xl font-bold tabular-nums text-text-primary' },
};

export const WithDelay: Story = {
  args: { from: 0, to: 9999, delay: 1000, className: 'text-2xl font-semibold tabular-nums text-emerald-light' },
};

export const StaggeredDashboard: Story = {
  render: () => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
      <Card>
        <CardHeader><CardTitle>Revenue</CardTitle></CardHeader>
        <CardContent>
          <AnimatedCounter
            from={0}
            to={48250}
            format={(v) => `$${v.toLocaleString()}`}
            className="text-3xl font-bold tabular-nums tracking-tight text-champagne"
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Receipts</CardTitle></CardHeader>
        <CardContent>
          <AnimatedCounter
            from={0}
            to={342}
            className="text-3xl font-bold tabular-nums tracking-tight text-text-primary"
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Pending</CardTitle></CardHeader>
        <CardContent>
          <AnimatedCounter
            from={0}
            to={12}
            className="text-3xl font-bold tabular-nums tracking-tight text-warning"
          />
        </CardContent>
      </Card>
    </div>
  ),
};
