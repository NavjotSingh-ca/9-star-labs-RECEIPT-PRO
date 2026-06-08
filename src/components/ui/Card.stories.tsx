import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction } from './card';
import { Button } from './button';
import { Settings, ArrowRight } from 'lucide-react';
import { withProviders } from '../../../.storybook/utils';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Card component with header, content, footer, title, description, and action slots. Uses `data-slot` attributes for child targeting.' } },
  },
  argTypes: {
    size: { control: 'select', options: ['default', 'sm'] },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    size: 'default',
    style: { maxWidth: 380 },
    children: (
      <>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>A description of the card contents goes here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-secondary">This is the main content area of the card. It can contain text, forms, or other components.</p>
        </CardContent>
        <CardFooter>
          <Button size="sm">Action</Button>
        </CardFooter>
      </>
    ),
  },
};

export const WithAction: Story = {
  render: () => (
    <Card style={{ maxWidth: 380 }}>
      <CardHeader>
        <CardTitle>Monthly Spend</CardTitle>
        <CardDescription>$12,450.00 this month</CardDescription>
        <CardAction>
          <Button size="icon-sm" variant="ghost" aria-label="Settings"><Settings className="size-4" /></Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold tabular-nums text-champagne">$12,450</span>
          <span className="text-xs text-emerald-light font-semibold">+12.3%</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full">View Details <ArrowRight className="size-3.5" /></Button>
      </CardFooter>
    </Card>
  ),
};

export const Small: Story = {
  render: () => (
    <Card size="sm" style={{ maxWidth: 280 }}>
      <CardHeader>
        <CardTitle>Compact</CardTitle>
        <CardDescription>Small variant for dashboards</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-text-secondary">Less padding, tighter spacing.</p>
      </CardContent>
    </Card>
  ),
};

export const DashboardRow: Story = {
  parameters: { viewport: { defaultViewport: 'wide' } },
  render: () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: 'Total Revenue', value: '$48,250', change: '+8.2%' },
        { label: 'Pending Approvals', value: '12', change: '-3' },
        { label: 'This Month', value: '$12,450', change: '+12.3%' },
        { label: 'Avg Receipt', value: '$84.20', change: '+2.1%' },
      ].map((kpi) => (
        <Card key={kpi.label}>
          <CardHeader>
            <CardDescription>{kpi.label}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums text-text-primary">{kpi.value}</span>
              <span className="text-xs font-semibold text-emerald-light">{kpi.change}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  ),
};

export const WithoutFooter: Story = {
  render: () => (
    <Card style={{ maxWidth: 380 }}>
      <CardHeader>
        <CardTitle>Simple Card</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-text-secondary">A minimal card with just a title and content. No footer or actions.</p>
      </CardContent>
    </Card>
  ),
};
