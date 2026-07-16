'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { logError } from '@/lib/logger';

interface Props {
  /** Child components to render within the error boundary */
  children: ReactNode;
  /** Optional custom fallback UI instead of the default error display */
  fallback?: ReactNode;
  /** Component name for error logging context */
  componentName?: string;
  /** Callback invoked when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component that catches JavaScript errors in its child component tree,
 * logs them, and displays a fallback UI instead of crashing the page.
 *
 * @example
 * ```tsx
 * <ErrorBoundary componentName="Scanner">
 *   <Scanner />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError(error, { action: 'component_error_boundary', component: this.props.componentName || 'Component' });
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return <DefaultFallback error={this.state.error} componentName={this.props.componentName} onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}

function DefaultFallback({ error, componentName, onRetry }: { error: Error | null; componentName?: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-[2rem] border border-danger/20 bg-danger/5 p-8" role="alert" aria-live="assertive">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-3 text-center max-w-md"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/10">
          <AlertTriangle className="h-6 w-6 text-danger" />
        </div>
        <div>
          <p className="text-sm font-bold text-danger">
            {componentName ? `${componentName} error` : 'Something went wrong'}
          </p>
          {error?.message && (
            <p className="mt-2 text-xs leading-relaxed text-text-secondary rounded-xl bg-danger/[0.04] border border-danger/10 px-3 py-2 font-mono">
              {error.message}
            </p>
          )}
          <p className="mt-3 text-xs leading-relaxed text-text-muted">
            We encountered an unexpected error. Your data is safe.
          </p>
        </div>
{error?.stack && process.env.NODE_ENV === 'development' && (
        <details className="w-full rounded-xl border border-glass-border bg-surface p-3">
          <summary className="flex items-center justify-center gap-1 cursor-pointer text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            <ChevronDown className="h-3 w-3" />
            Stack trace
          </summary>
          <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap break-words text-[11px] text-danger/70">
            {error.stack}
          </pre>
        </details>
      )}
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-[2rem] bg-champagne/15 px-4 py-2 text-xs font-bold text-champagne transition hover:bg-champagne/20"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try Again
        </button>
      </motion.div>
    </div>
  );
}
