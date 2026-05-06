'use client';

import { Component, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[ErrorBoundary] ${this.props.componentName || 'Component'} crashed:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-[2rem] border border-red-500/20 bg-red-500/5 p-6">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <div className="text-center">
            <p className="text-sm font-bold text-red-400">Something went wrong</p>
            <p className="mt-1 text-xs text-text-muted">
              {this.props.componentName ? `${this.props.componentName} failed to load. ` : ''}
              Please refresh or try again.
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 rounded-[2rem] border border-red-500/30 px-4 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/10"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
