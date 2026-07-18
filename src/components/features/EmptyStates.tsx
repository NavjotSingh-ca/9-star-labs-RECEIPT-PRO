import React from 'react';
import { Receipt, Upload, FileText, AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  type: 'no-receipts' | 'no-search-results' | 'no-bank-matches' | 'no-budget' | 'error';
  action?: React.ReactNode;
}

/**
 * EmptyStates - Beautiful empty state illustrations
 * Improves UX when no data is available
 */
export default function EmptyState({ type, action }: EmptyStateProps) {
  const configs = {
    'no-receipts': {
      icon: Receipt,
      title: 'No receipts yet',
      description: 'Start scanning to build your expense history for CRA compliance.',
    },
    'no-search-results': {
      icon: AlertCircle,
      title: 'No matching receipts',
      description: 'Try adjusting your search or filters.',
    },
    'no-bank-matches': {
      icon: Upload,
      title: 'No unmatched transactions',
      description: 'All bank transactions have been reconciled.',
    },
    'no-budget': {
      icon: FileText,
      title: 'No budgets set',
      description: 'Create monthly budgets to track spending limits.',
    },
    error: {
      icon: AlertCircle,
      title: 'Something went wrong',
      description: 'Try refreshing or contact support.',
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-glass-border bg-surface p-12 text-center animate-in fade-in slide-up-from-bottom-4 duration-500">
      <div className="relative mb-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-champagne/15 mb-4 transition-all duration-300">
          <Icon className="h-8 w-8 text-champagne" aria-hidden="true" />
        </div>
        {/* Decorative ring */}
        <div className="absolute inset-0 rounded-full border border-champagne/10 animate-pulse-soft" />
      </div>
      <h3 className="text-lg font-bold text-text-primary mb-2">{config.title}</h3>
      <p className="text-sm text-text-muted max-w-sm mb-6">{config.description}</p>
      {action && (
        <div className="animate-in fade-in slide-up-from-bottom-2 duration-500 delay-200">
          {action}
        </div>
      )}
    </div>
  );
}