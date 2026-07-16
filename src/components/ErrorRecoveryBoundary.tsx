'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { logError } from '@/lib/logger';

interface ErrorRecoveryBoundaryProps {
  children: ReactNode;
  fallbackPath?: string;
  featureName?: string;
}

interface ErrorRecoveryState {
  hasError: boolean;
  error: Error | null;
  errorId: string;
  retryCount: number;
}

/**
 * ErrorRecoveryBoundary - Advanced error boundary with recovery actions
 * Provides multiple recovery options: retry, navigate home, report bug
 * Tracks error IDs for debugging and shows user-friendly messages
 */
export class ErrorRecoveryBoundary extends Component<
  ErrorRecoveryBoundaryProps,
  ErrorRecoveryState
> {
  constructor(props: ErrorRecoveryBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: '',
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError('ErrorRecoveryBoundary', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      featureName: this.props.featureName,
    });
  }

  handleRetry = () => {
    this.setState(prev => ({
      hasError: false,
      error: null,
      errorId: '',
      retryCount: prev.retryCount + 1,
    }));
  };

  handleNavigateHome = () => {
    window.location.href = this.props.fallbackPath || '/';
  };

  handleReportBug = () => {
    // Copy error ID to clipboard for support
    navigator.clipboard.writeText(this.state.errorId);
    // In production, integrate with Sentry or similar
    window.open('mailto:support@leduc.receipt?subject=Error%20Report&body=Error%20ID:%20' + this.state.errorId);
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-glass-border bg-card p-8 text-center"
          role="alert"
          aria-live="assertive"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-danger/10">
            <AlertTriangle className="h-8 w-8 text-danger" aria-hidden="true" />
          </div>

          <h3 className="mb-2 text-lg font-bold text-text-primary">
            Something went wrong
          </h3>

          <p className="mb-1 text-sm text-text-secondary">
            {this.props.featureName || 'This feature'} encountered an unexpected error.
          </p>

          <p className="mb-6 text-xs text-text-muted">
            Error ID: {this.state.errorId}
            {' · '}
            {this.state.retryCount > 0 && `Attempt ${this.state.retryCount + 1}`}
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 rounded-xl bg-champagne px-4 py-2 text-sm font-bold text-obsidian transition hover:bg-champagne-dim focus:outline-none focus:ring-2 focus:ring-champagne/40"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Try Again
            </button>

            <button
              type="button"
              onClick={this.handleNavigateHome}
              className="inline-flex items-center gap-2 rounded-xl border border-glass-border bg-surface px-4 py-2 text-sm font-medium text-text-secondary transition hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-champagne/40"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              Go Home
            </button>

            <button
              type="button"
              onClick={this.handleReportBug}
              className="inline-flex items-center gap-2 rounded-xl border border-glass-border bg-surface px-4 py-2 text-sm font-medium text-text-secondary transition hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-champagne/40"
              aria-label="Copy error ID and open support email"
            >
              <Bug className="h-4 w-4" aria-hidden="true" />
              Report Bug
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}