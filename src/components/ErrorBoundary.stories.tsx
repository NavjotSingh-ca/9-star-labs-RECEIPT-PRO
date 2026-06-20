import type { Meta, StoryObj } from '@storybook/nextjs';
import { ErrorBoundary } from './ErrorBoundary';
import { withProviders } from '../../.storybook/utils';
import { Button } from '@/components/ui/button';
import React from 'react';

function BuggyComponent() {
  // This triggers a runtime error during render without TypeScript errors
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obj = {} as any;
  return <div>{obj.missing.method()}</div>;
}

const meta: Meta<typeof ErrorBoundary> = {
  title: 'UI/ErrorBoundary',
  component: ErrorBoundary,
  decorators: [withProviders],
  parameters: {
    docs: { description: { component: 'Class-component error boundary with fallback UI. Shows error icon, component name, and "Try Again" button. Accepts optional custom fallback.' } },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ErrorBoundary>;

export const DefaultFallback: Story = {
  render: () => (
    <ErrorBoundary componentName="TestWidget">
      <BuggyComponent />
    </ErrorBoundary>
  ),
};

export const CustomFallback: Story = {
  render: () => (
    <ErrorBoundary fallback={<div className="p-12 text-center text-champagne font-bold">Custom error display</div>}>
      <BuggyComponent />
    </ErrorBoundary>
  ),
};

export const HealthyChild: Story = {
  render: () => (
    <ErrorBoundary componentName="WorkingWidget">
      <div className="p-8 rounded-2xl bg-card text-card-foreground text-center">
        <p className="text-lg font-bold text-text-primary">Everything is fine</p>
        <p className="text-sm text-text-secondary mt-2">This child component renders normally.</p>
        <Button className="mt-4" size="sm">Click me</Button>
      </div>
    </ErrorBoundary>
  ),
};
